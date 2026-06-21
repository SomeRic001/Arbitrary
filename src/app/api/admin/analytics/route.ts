import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { usersTable, userTasksTable, pointsLogTable } from "@/src/db/schema";
import { eq, sql, and, gte, lt } from "drizzle-orm";
import { requireAdmin } from "@/src/services/auth.service";

interface Trend {
  direction: "up" | "down" | "flat";
  /** Percent change vs. the prior window. Null when the prior window was zero (no baseline to compare against). */
  changePct: number | null;
}

function computeTrend(curr: number, prev: number): Trend {
  if (prev === 0) {
    if (curr === 0) return { direction: "flat", changePct: 0 };
    return { direction: "up", changePct: null };
  }
  const changePct = Math.round(((curr - prev) / prev) * 100);
  const direction = changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  return { direction, changePct };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    [pointsResult],
    [activeResult],
    [pendingResult],
    [inProgressResult],
    [pointsLast7],
    [pointsPrev7],
    [activeLast7],
    [activePrev7],
  ] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${usersTable.points}), 0)` })
      .from(usersTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(
        sql`${usersTable.lastLoginAt} >= ${thirtyDaysAgo} OR ${usersTable.completedTasksCount} > 0`,
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTasksTable)
      .where(eq(userTasksTable.status, "Pending Verification")),
    // Tasks currently being worked on (picked up but not yet submitted)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTasksTable)
      .where(eq(userTasksTable.status, "In Progress")),
    // Points distributed in the last 7 days vs. the 7 days before that
    db
      .select({ total: sql<number>`coalesce(sum(${pointsLogTable.points}), 0)` })
      .from(pointsLogTable)
      .where(gte(pointsLogTable.createdAt, sevenDaysAgo)),
    db
      .select({ total: sql<number>`coalesce(sum(${pointsLogTable.points}), 0)` })
      .from(pointsLogTable)
      .where(
        and(
          gte(pointsLogTable.createdAt, fourteenDaysAgo),
          lt(pointsLogTable.createdAt, sevenDaysAgo),
        ),
      ),
    // Users who logged in during the last 7 days vs. the 7 days before that
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(gte(usersTable.lastLoginAt, sevenDaysAgo)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(
        and(
          gte(usersTable.lastLoginAt, fourteenDaysAgo),
          lt(usersTable.lastLoginAt, sevenDaysAgo),
        ),
      ),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalPointsDistributed: Number(pointsResult?.total ?? 0),
      activeUsers: Number(activeResult?.count ?? 0),
      pendingVerifications: Number(pendingResult?.count ?? 0),
      tasksInProgress: Number(inProgressResult?.count ?? 0),
    },
    trends: {
      totalPointsDistributed: computeTrend(
        Number(pointsLast7?.total ?? 0),
        Number(pointsPrev7?.total ?? 0),
      ),
      activeUsers: computeTrend(
        Number(activeLast7?.count ?? 0),
        Number(activePrev7?.count ?? 0),
      ),
      // No trend for pendingVerifications: user_tasks has no "submitted at"
      // timestamp distinct from assignedAt (task-pick time).
      pendingVerifications: null,
      // No trend for tasksInProgress: it's a current snapshot, not a time-windowed sum.
      tasksInProgress: null,
    },
  });
}
