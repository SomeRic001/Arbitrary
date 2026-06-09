import { db } from "@/src/db";
import {
  usersTable,
  userTasksTable,
  tasksTable,
} from "@/src/db/schema";
import { eq, and, sql, gte, desc, inArray, ne } from "drizzle-orm";
import { ServiceResult, ok } from "./result";

export type FraudBreakdown = {
  sharedFingerprint: number;
  multipleAccounts: number;
  fastCompletion: number;
  highVolume: number;
};

export type FraudUser = {
  userId: number;
  userName: string | null;
  userEmail: string;
  riskScore: number;
  breakdown: FraudBreakdown;
  completedTasks: number;
};

export type FraudReport = {
  flaggedUsers: FraudUser[];
  totalUsersScanned: number;
  flaggedCount: number;
};

const SHARED_FINGERPRINT_PTS = 30;
const MULTIPLE_ACCOUNTS_PTS = 30;
const FAST_COMPLETION_PTS = 20;
const HIGH_VOLUME_PTS = 20;
const FLAG_THRESHOLD = 70;
const FAST_COMPLETION_RATIO = 0.3;
const HIGH_VOLUME_LIMIT = 20;
const HIGH_VOLUME_WINDOW_HOURS = 1;

export const FraudService = {
  async getFraudReport(): Promise<ServiceResult<FraudReport>> {
    const allUsers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        completedTasksCount: usersTable.completedTasksCount,
      })
      .from(usersTable)
      .where(sql`LOWER(${usersTable.role}) = 'user'`)
      .orderBy(desc(usersTable.completedTasksCount));

    const userIds = allUsers.map((u) => u.id);
    if (userIds.length === 0) {
      return ok({ flaggedUsers: [], totalUsersScanned: 0, flaggedCount: 0 });
    }

    // ── 1 & 2: Shared fingerprint / multiple accounts ──
    // Find all fingerprints that belong to more than one user
    const sharedFpRows = await db
      .select({
        fingerprint: userTasksTable.submissionFingerprint,
      })
      .from(userTasksTable)
      .where(
        and(
          inArray(userTasksTable.userId, userIds),
          sql`${userTasksTable.submissionFingerprint} IS NOT NULL`,
        ),
      )
      .groupBy(userTasksTable.submissionFingerprint)
      .having(sql`count(DISTINCT ${userTasksTable.userId}) > 1`);

    const sharedFingerprints = sharedFpRows
      .map((r) => r.fingerprint)
      .filter(Boolean) as string[];

    // For each shared fingerprint, get all distinct users
    const fpUserRows = sharedFingerprints.length > 0
      ? await db
        .select({
          fingerprint: userTasksTable.submissionFingerprint,
          userId: userTasksTable.userId,
        })
        .from(userTasksTable)
        .where(
          and(
            inArray(userTasksTable.submissionFingerprint, sharedFingerprints),
            inArray(userTasksTable.userId, userIds),
          ),
        )
        .groupBy(userTasksTable.submissionFingerprint, userTasksTable.userId)
      : [];

    // Group: fingerprint -> Set<userId>
    const fpToUsers = new Map<string, Set<number>>();
    for (const row of fpUserRows) {
      const fp = row.fingerprint;
      if (!fp) continue;
      let users = fpToUsers.get(fp);
      if (!users) {
        users = new Set();
        fpToUsers.set(fp, users);
      }
      users.add(row.userId);
    }

    // Build per-user fingerprint scores
    const fingerprintScores = new Map<number, { sharedFingerprint: number; multipleAccounts: number }>();
    for (const [fp, users] of fpToUsers) {
      const userCount = users.size;
      for (const uid of users) {
        const entry = fingerprintScores.get(uid) || { sharedFingerprint: 0, multipleAccounts: 0 };
        entry.sharedFingerprint += SHARED_FINGERPRINT_PTS;
        if (userCount >= 3) {
          entry.multipleAccounts += MULTIPLE_ACCOUNTS_PTS;
        }
        fingerprintScores.set(uid, entry);
      }
    }

    // ── 3: Fast completion per user ──
    const fastCompletionRows = await db
      .select({
        userId: userTasksTable.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(userTasksTable)
      .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
      .where(
        and(
          inArray(userTasksTable.userId, userIds),
          sql`${userTasksTable.completionDurationSeconds} IS NOT NULL`,
          sql`${tasksTable.watchDuration} IS NOT NULL`,
          sql`${tasksTable.watchDuration} > 0`,
          sql`${userTasksTable.completionDurationSeconds} < ${tasksTable.watchDuration} * ${FAST_COMPLETION_RATIO}::numeric`,
        ),
      )
      .groupBy(userTasksTable.userId);

    const fastCompletionMap = new Map<number, number>(
      fastCompletionRows.map((r) => [r.userId, r.count]),
    );

    // ── 4: High submission volume per user ──
    const oneHourAgo = new Date(
      Date.now() - HIGH_VOLUME_WINDOW_HOURS * 60 * 60 * 1000,
    );
    const volumeRows = await db
      .select({
        userId: userTasksTable.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(userTasksTable)
      .where(
        and(
          inArray(userTasksTable.userId, userIds),
          sql`${userTasksTable.status} IN ('Completed', 'Verified')`,
          gte(userTasksTable.completedAt, oneHourAgo),
        ),
      )
      .groupBy(userTasksTable.userId);

    const volumeMap = new Map<number, number>(
      volumeRows.map((r) => [r.userId, r.count]),
    );

    // ── Build results ──
    const flaggedUsers: FraudUser[] = [];

    for (const user of allUsers) {
      const fpScore = fingerprintScores.get(user.id);
      const sharedFingerprint = fpScore?.sharedFingerprint ?? 0;
      const multipleAccounts = fpScore?.multipleAccounts ?? 0;
      const fastCompletion = (fastCompletionMap.get(user.id) ?? 0) > 0 ? FAST_COMPLETION_PTS : 0;
      const highVolume = (volumeMap.get(user.id) ?? 0) >= HIGH_VOLUME_LIMIT ? HIGH_VOLUME_PTS : 0;

      const riskScore =
        sharedFingerprint + multipleAccounts + fastCompletion + highVolume;

      await db
        .update(usersTable)
        .set({
          fraudRiskScore: riskScore,
          isFlagged: riskScore > FLAG_THRESHOLD,
        })
        .where(eq(usersTable.id, user.id));

      if (riskScore > FLAG_THRESHOLD) {
        flaggedUsers.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          riskScore,
          breakdown: {
            sharedFingerprint,
            multipleAccounts,
            fastCompletion,
            highVolume,
          },
          completedTasks: user.completedTasksCount,
        });
      }
    }

    return ok({
      flaggedUsers,
      totalUsersScanned: allUsers.length,
      flaggedCount: flaggedUsers.length,
    });
  },

  async clearFlags(userId: number): Promise<ServiceResult<{ success: true }>> {
    await db
      .update(usersTable)
      .set({ fraudRiskScore: 0, isFlagged: false })
      .where(eq(usersTable.id, userId));
    return ok({ success: true });
  },
};
