import { db } from './index';
import { usersTable, referralsTable } from './schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getCurrentMonthlyTier, getTierKey } from '@/src/lib/gamification';

export type TopUser = {
  id: number;
  name: string | null;
  image: string | null;
  points: number;
  monthlyPoints: number;
  tasks: number;
  referrals: number;
  tier: string;
};

export type UserRankInfo = TopUser & { rank: number };

export async function getTopUsers(limit: number = 100): Promise<TopUser[]> {
  const result = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      image: usersTable.image,
      points: usersTable.monthlyPoints,
      monthlyPoints: usersTable.monthlyPoints,
      tasks: usersTable.completedTasksCount,
      referrals: sql<number>`(select count(*)::int from ${referralsTable} where ${referralsTable.referrerId} = users.id)`,
    })
    .from(usersTable)
    .where(eq(usersTable.role, 'USER'))
    .orderBy(desc(usersTable.monthlyPoints))
    .limit(limit);

  return result.map((user) => ({
    ...user,
    monthlyPoints: Number(user.monthlyPoints),
    tasks: Number(user.tasks),
    referrals: Number(user.referrals),
    // Single source of truth: getCurrentMonthlyTier from gamification.ts
    tier: getTierKey(getCurrentMonthlyTier(Number(user.monthlyPoints))),
  }));
}

/**
 * Returns the logged-in user's rank, points, tier and stats even when they
 * fall outside the top-100 list. Uses a single window-function query so we
 * never have to fetch all rows into JS.
 *
 * Returns null when userId is not found (e.g. admin, or user deleted).
 */
export async function getUserRankInfo(userId: number): Promise<UserRankInfo | null> {
  // Rank = (number of USERs with strictly more monthly_points) + 1.
  // This avoids a full-table window-function sort — with an index on
  // monthly_points it runs in O(log N) instead of O(N log N).
  // Tie-break: users with the same points but a lower id rank higher,
  // matching the ORDER BY used in getTopUsers().
  const rows = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.image,
      u.monthly_points                                          AS "monthlyPoints",
      u.completed_tasks_count                                   AS tasks,
      (SELECT count(*)::int FROM referrals WHERE referrer_id = u.id) AS referrals,
      (
        SELECT count(*)::int + 1
        FROM   users other
        WHERE  other.role = 'USER'
          AND  (
                 other.monthly_points > u.monthly_points
                 OR (other.monthly_points = u.monthly_points AND other.id < u.id)
               )
      ) AS rank
    FROM users u
    WHERE u.id = ${userId}
      AND u.role = 'USER'
    LIMIT 1
  `);

  const row = rows.rows[0] as {
    id: number;
    name: string | null;
    image: string | null;
    monthlyPoints: number | string;
    tasks: number | string;
    rank: number | string;
    referrals: number | string;
  } | undefined;

  if (!row) return null;

  const monthlyPoints = Number(row.monthlyPoints);
  return {
    id: Number(row.id),
    name: row.name,
    image: row.image,
    points: monthlyPoints,
    monthlyPoints,
    tasks: Number(row.tasks),
    referrals: Number(row.referrals),
    tier: getTierKey(getCurrentMonthlyTier(monthlyPoints)),
    rank: Number(row.rank),
  };
}