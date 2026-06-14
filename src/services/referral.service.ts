import crypto from "crypto";
import { db } from "@/src/db";
import { usersTable, referralsTable, userTasksTable, pointsLogTable } from "@/src/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { ServiceResult, ok, fail } from "./result";
import { rateLimit } from "@/src/lib/rate-limit";

export const REFERRAL_BONUS = 100;

export const ReferralService = {
  async assignReferralCode(userId: number): Promise<ServiceResult<{ code: string }>> {
    const [existing] = await db
      .select({ code: usersTable.referralCode })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!existing) return fail("User not found", 404);
    if (existing.code) return ok({ code: existing.code });

    let code = crypto.randomBytes(4).toString("hex").toUpperCase();
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [updated] = await db
          .update(usersTable)
          .set({ referralCode: code })
          .where(and(eq(usersTable.id, userId), isNull(usersTable.referralCode)))
          .returning({ code: usersTable.referralCode });
        if (updated?.code) return ok({ code: updated.code });
        code = crypto.randomBytes(4).toString("hex").toUpperCase();
      } catch (err: any) {
        if (err?.code !== "23505" || attempt === 4) throw err;
        code = crypto.randomBytes(4).toString("hex").toUpperCase();
      }
    }
    return fail("Failed to generate unique referral code", 500);
  },

  async bindReferralCode(
    userId: number,
    referralCode: string,
  ): Promise<ServiceResult<{ bonusAwarded: boolean }>> {
    const rl = await rateLimit(`referral:bind:${userId}`, 3, 60_000);
    if (!rl.allowed) return fail("Too many attempts. Try again later.", 429);

    const normalized = referralCode.trim().toUpperCase();

    try {
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT id FROM ${usersTable} WHERE id = ${userId} FOR UPDATE`);

        const [user] = await tx
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId));

        if (!user) throw new Error("User not found");
        if (user.referredBy) throw new Error("Already referred by someone");

        const [referrer] = await tx
          .select()
          .from(usersTable)
          .where(eq(usersTable.referralCode, normalized));

        if (!referrer) throw new Error("Invalid referral code");
        if (referrer.id === userId) throw new Error("Cannot refer yourself");

        if (referrer.createdAt && user.createdAt && referrer.createdAt > user.createdAt) {
          throw new Error("Cannot link to an account younger than yours");
        }

        const [completedResult] = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(userTasksTable)
          .where(
            and(
              eq(userTasksTable.userId, userId),
              sql`LOWER(${userTasksTable.status}) IN ('completed', 'verified')`,
            ),
          );

        const hasCompletedRequiredTasks = (completedResult?.count ?? 0) >= 3;

        await tx
          .update(usersTable)
          .set({ referredBy: referrer.id, referralRewarded: hasCompletedRequiredTasks })
          .where(eq(usersTable.id, userId));

        await tx.insert(referralsTable).values({
          referrerId: referrer.id,
          referredId: userId,
          pointsAwarded: hasCompletedRequiredTasks ? REFERRAL_BONUS : 0,
        });

        if (hasCompletedRequiredTasks) {
          const [refUser] = await tx
            .select({ lifetimePoints: usersTable.monthlyPoints })
            .from(usersTable)
            .where(eq(usersTable.id, referrer.id));
          await tx
            .update(usersTable)
            .set({
              points: sql`${usersTable.points} + ${REFERRAL_BONUS}`,
              monthlyPoints: sql`${usersTable.monthlyPoints} + ${REFERRAL_BONUS}`,
            })
            .where(eq(usersTable.id, referrer.id));
        }

        return { bonusAwarded: hasCompletedRequiredTasks };
      });

      return ok(result);
    } catch (err: any) {
      return fail(err.message, 400);
    }
  },

  async getReferralStats(
    userId: number,
  ): Promise<
    ServiceResult<{
      code: string;
      link: string;
      totalReferred: number;
      converted: number;
      pointsEarned: number;
    }>
  > {
    const [user] = await db
      .select({ code: usersTable.referralCode })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user?.code) return fail("No referral code", 404);

    const referrals = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referrerId, userId));

    return ok({
      code: user.code,
      link: `${process.env.NEXTAUTH_URL}/signup?ref=${user.code}`,
      totalReferred: referrals.length,
      converted: referrals.filter((r) => (r.pointsAwarded ?? 0) > 0).length,
      pointsEarned: referrals.reduce((sum, r) => sum + (r.pointsAwarded ?? 0), 0),
    });
  },

  async awardReferralBonusIfEligible(userId: number, tx?: any): Promise<void> {
    const runInTransaction = async (transactionContext: any) => {
      const [user] = await transactionContext
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .for("update");

      const referredBy = user?.referredBy;
      if (!referredBy || user?.referralRewarded) return;

      const [completedResult] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(userTasksTable)
        .where(
          and(
            eq(userTasksTable.userId, userId),
            sql`LOWER(${userTasksTable.status}) IN ('completed', 'verified')`,
          ),
        );

      if ((completedResult?.count ?? 0) < 3) return;

      const [referrer] = await tx

        .select()
        .from(usersTable)
        .where(eq(usersTable.id, referredBy));
      if (!referrer) return;

      await transactionContext
        .update(usersTable)
        .set({ referralRewarded: true })
        .where(eq(usersTable.id, userId));

      await transactionContext
        .update(referralsTable)
        .set({ pointsAwarded: REFERRAL_BONUS })
        .where(
          and(
            eq(referralsTable.referrerId, referredBy),
            eq(referralsTable.referredId, userId),
          ),
        );

      await transactionContext
        .update(usersTable)
        .set({
          points: sql`${usersTable.points} + ${REFERRAL_BONUS}`,
          monthlyPoints: sql`${usersTable.monthlyPoints} + ${REFERRAL_BONUS}`,
        })
        .where(eq(usersTable.id, referredBy));

      await transactionContext.insert(pointsLogTable).values({
        userId: referredBy,
        points: REFERRAL_BONUS,
        reason: `Referral bonus for referring user #${userId}`,
      });
    };

    if (tx) {
      await runInTransaction(tx);
    } else {
      await db.transaction(async (newTx) => {
        await runInTransaction(newTx);
      });
    }
  },
};
