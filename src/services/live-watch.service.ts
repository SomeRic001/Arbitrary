import { db } from "@/src/db";
import { liveWatchSessionsTable, pointsLogTable, usersTable } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ServiceResult, ok, fail } from "./result";

const POINTS_PER_MINUTE = 10;
const MAX_DAILY_POINTS = 500;
const HEARTBEAT_MIN_GAP = 5;
const HEARTBEAT_MAX_GAP = 120;

export const LiveWatchService = {
  async heartbeat(
    userId: number,
    youtubeId: string,
    deltaSeconds: number,
  ): Promise<ServiceResult<{ accumulatedSeconds: number; pointsJustEarned: number; pointsTotal: number }>> {
    const now = new Date();

    if (deltaSeconds < HEARTBEAT_MIN_GAP) {
      return fail("Heartbeat too frequent", 429);
    }
    if (deltaSeconds > HEARTBEAT_MAX_GAP) {
      return fail("Time delta too large", 400);
    }

    const existing = await db.query.liveWatchSessionsTable.findFirst({
      where: and(
        eq(liveWatchSessionsTable.userId, userId),
        eq(liveWatchSessionsTable.youtubeId, youtubeId),
      ),
    });

    if (existing) {
      const lastBeat = existing.lastHeartbeatAt ?? existing.createdAt;
      const gapSeconds = (now.getTime() - lastBeat.getTime()) / 1000;
      if (gapSeconds < HEARTBEAT_MIN_GAP) {
        return fail("Heartbeat too frequent", 429);
      }

      const newAccumulated = existing.accumulatedSeconds + deltaSeconds;
      const pointsJustEarned = this.calculatePoints(newAccumulated) - existing.pointsAwarded;

      await db.update(liveWatchSessionsTable)
        .set({
          accumulatedSeconds: newAccumulated,
          pointsAwarded: existing.pointsAwarded + Math.max(0, pointsJustEarned),
          lastHeartbeatAt: now,
        })
        .where(eq(liveWatchSessionsTable.id, existing.id));

      if (pointsJustEarned > 0) {
        const dailyTotal = await this.getDailyPointsTotal(userId);
        const capped = Math.min(pointsJustEarned, Math.max(0, MAX_DAILY_POINTS - dailyTotal));

        if (capped > 0) {
          await db.transaction(async (tx) => {
            await tx.insert(pointsLogTable).values({
              userId,
              points: capped,
              reason: "Live stream watch",
            });
            await tx.update(usersTable)
              .set({
                points: sql`${usersTable.points} + ${capped}`,
                monthlyPoints: sql`${usersTable.monthlyPoints} + ${capped}`,
              })
              .where(eq(usersTable.id, userId));
          });
        }

        return ok({
          accumulatedSeconds: newAccumulated,
          pointsJustEarned: capped,
          pointsTotal: existing.pointsAwarded + capped,
        });
      }

      return ok({
        accumulatedSeconds: newAccumulated,
        pointsJustEarned: 0,
        pointsTotal: existing.pointsAwarded,
      });
    }

    const newAccumulated = deltaSeconds;
    const pointsJustEarned = this.calculatePoints(newAccumulated);

    await db.insert(liveWatchSessionsTable).values({
      userId,
      youtubeId,
      accumulatedSeconds: newAccumulated,
      pointsAwarded: pointsJustEarned,
      lastHeartbeatAt: now,
    });

    if (pointsJustEarned > 0) {
      const dailyTotal = await this.getDailyPointsTotal(userId);
      const capped = Math.min(pointsJustEarned, Math.max(0, MAX_DAILY_POINTS - dailyTotal));

      if (capped > 0) {
        await db.transaction(async (tx) => {
          await tx.insert(pointsLogTable).values({
            userId,
            points: capped,
            reason: "Live stream watch",
          });
          await tx.update(usersTable)
            .set({
              points: sql`${usersTable.points} + ${capped}`,
              monthlyPoints: sql`${usersTable.monthlyPoints} + ${capped}`,
            })
            .where(eq(usersTable.id, userId));
        });
      }

      return ok({
        accumulatedSeconds: newAccumulated,
        pointsJustEarned: capped,
        pointsTotal: capped,
      });
    }

    return ok({
      accumulatedSeconds: newAccumulated,
      pointsJustEarned: 0,
      pointsTotal: 0,
    });
  },

  calculatePoints(accumulatedSeconds: number): number {
    return Math.floor(accumulatedSeconds / 60) * POINTS_PER_MINUTE;
  },

  async getDailyPointsTotal(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(points), 0)` })
      .from(pointsLogTable)
      .where(
        and(
          eq(pointsLogTable.userId, userId),
          eq(pointsLogTable.reason, "Live stream watch"),
          sql`${pointsLogTable.createdAt} >= ${today}`,
        ),
      );

    return result[0]?.total ?? 0;
  },
};
