import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { UserService } from "@/src/services/user.service";
import { db } from "@/src/db";
import {
  userTasksTable,
  tasksTable,
  pointsLogTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Admin-only "User Detail" view. This intentionally does NOT reuse the
 * self-service /api/user/* routes (profile, points-log, tasks) as-is,
 * since those are hard-scoped to the logged-in user via requireUser() —
 * reusing them directly would mean either loosening that scope (a real
 * security regression) or duplicating routes per caller. Instead this
 * reuses the same underlying service/schema pieces those routes are built
 * on (UserService.getProfile already takes a userId param; the rest are
 * the same tables/joins as the self-service equivalents), just gated by
 * requireAdmin() and parameterized by the :id route param.
 *
 * No new tables, audit log, or role model — this is read-only aggregation
 * over existing data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: idParam } = await params;
  const userId = Number(idParam);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const profileResult = await UserService.getProfile(userId);
  if (!profileResult.success) {
    return NextResponse.json(
      { error: profileResult.error },
      { status: profileResult.status },
    );
  }

  const [assignedTasks, pointsHistory] = await Promise.all([
    // Assigned tasks — same join shape as the user's own task list.
    db
      .select({
        id: userTasksTable.id,
        taskId: userTasksTable.taskId,
        title: tasksTable.title,
        taskType: tasksTable.taskType,
        points: tasksTable.points,
        status: userTasksTable.status,
        assignedAt: userTasksTable.assignedAt,
        completedAt: userTasksTable.completedAt,
        rejectionReason: userTasksTable.rejectionReason,
      })
      .from(userTasksTable)
      .leftJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
      .where(eq(userTasksTable.userId, userId))
      .orderBy(desc(userTasksTable.assignedAt))
      .limit(25),

    // Points history — identical shape to /api/user/points-log.
    db
      .select({
        id: pointsLogTable.id,
        points: pointsLogTable.points,
        reason: pointsLogTable.reason,
        createdAt: pointsLogTable.createdAt,
        taskTitle: tasksTable.title,
      })
      .from(pointsLogTable)
      .leftJoin(tasksTable, eq(pointsLogTable.taskId, tasksTable.id))
      .where(eq(pointsLogTable.userId, userId))
      .orderBy(desc(pointsLogTable.createdAt))
      .limit(25),
  ]);

  return NextResponse.json({
    profile: profileResult.data,
    assignedTasks,
    pointsHistory,
  });
}