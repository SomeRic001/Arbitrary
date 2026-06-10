import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { TaskService } from "@/src/services/task.service";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/src/db";
import { tasksTable, userTasksTable } from "@/src/db/schema";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const tasksWithStats = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      taskType: tasksTable.taskType,
      points: tasksTable.points,
      pickedUp: sql<number>`count(${userTasksTable.id})::int`,
      completedCount: sql<number>`count(${userTasksTable.id}) FILTER (WHERE ${userTasksTable.status} IN ('Completed', 'Verified'))::int`,
      cancelledCount: sql<number>`count(${userTasksTable.id}) FILTER (WHERE ${userTasksTable.status} = 'Cancelled')::int`,
    })
    .from(tasksTable)
    .leftJoin(userTasksTable, eq(tasksTable.id, userTasksTable.taskId))
    .groupBy(tasksTable.id)
    .orderBy(desc(tasksTable.createdAt));

  const result = tasksWithStats.map((t) => {
    const picked = t.pickedUp;
    const completed = t.completedCount;
    const cancelled = t.cancelledCount;

    return {
      taskId: t.id,
      title: t.title,
      taskType: t.taskType,
      points: t.points,
      pickedUp: picked,
      completedCount: completed,
      cancelled: cancelled,
      conversionRate: picked > 0 ? Math.round((completed / picked) * 100) : 0,
      dropOffRate: picked > 0 ? Math.round((cancelled / picked) * 100) : 0,
    };
  });

  return NextResponse.json({ tasks: result }, { status: 200 });
}
