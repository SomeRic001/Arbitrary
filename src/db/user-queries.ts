import { db } from './index';
import { usersTable, referralsTable, pointsLogTable } from './schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
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

export async function getTopUsers(limit: number = 100): Promise<TopUser[]> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const result = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      image: usersTable.image,
      points: usersTable.monthlyPoints,
      monthlyPoints: sql<number>`
        coalesce((
          select sum(${pointsLogTable.points})::int
          from ${pointsLogTable}
          where ${pointsLogTable.userId} = ${usersTable.id}
            and ${pointsLogTable.createdAt} >= ${monthStart}
        ), 0)
      `,
      tasks: usersTable.completedTasksCount,
      referrals: sql<number>`(select count(*)::int from ${referralsTable} where ${referralsTable.referrerId} = users.id)`,
    })
    .from(usersTable)
    .where(eq(usersTable.role, 'USER'))
    .orderBy(desc(sql`coalesce((select sum(${pointsLogTable.points})::int from ${pointsLogTable} where ${pointsLogTable.userId} = ${usersTable.id} and ${pointsLogTable.createdAt} >= ${monthStart}), 0)`))
    .limit(limit);

  return result.map((user) => ({
    ...user,
    monthlyPoints: Number(user.monthlyPoints),
    tasks: Number(user.tasks),
    referrals: Number(user.referrals),
    tier: getTierKey(getCurrentMonthlyTier(Number(user.monthlyPoints))),
  }));
}