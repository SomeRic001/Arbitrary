import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { watchSessionsTable, tasksTable } from "@/src/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireUser } from "@/src/services/auth.service";

// POST — create or resume a watch session
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const userId = auth.data.id;

  const [task] = await db
    .select({ watchDuration: tasksTable.watchDuration })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const videoDuration = task.watchDuration ?? 60;

  // Reuse existing active or paused session if one exists
  const [existing] = await db
    .select()
    .from(watchSessionsTable)
    .where(
      and(
        eq(watchSessionsTable.userId, userId),
        eq(watchSessionsTable.taskId, taskId),
        inArray(watchSessionsTable.status, ["active", "paused"]),
      ),
    );

  if (existing) {
    await db
      .update(watchSessionsTable)
      .set({
        lastCheckpointAt: new Date(),
        heartbeatLog: [],
        status: "active",
      })
      .where(eq(watchSessionsTable.id, existing.id));

    return NextResponse.json({
      sessionId: existing.id,
      requiredSeconds: videoDuration,
      accumulatedSeconds: existing.accumulatedWatchTime || 0,
    });
  }

  const [newSession] = await db
    .insert(watchSessionsTable)
    .values({
      userId,
      taskId,
      videoDuration,
      accumulatedWatchTime: 0,
      lastPositionSeconds: 0,
      heartbeatLog: [],
      status: "active",
      lastCheckpointAt: new Date(),
    })
    .returning();

  return NextResponse.json({
    sessionId: newSession.id,
    requiredSeconds: videoDuration,
  });
}

// PATCH — heartbeat: update accumulated watch time and playback position
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const userId = auth.data.id;
  const body = await req.json();
  const { sessionId, positionSeconds } = body;

  if (!sessionId || positionSeconds == null) {
    return NextResponse.json({ error: "Missing sessionId or positionSeconds" }, { status: 400 });
  }

  const [watchSession] = await db
    .select()
    .from(watchSessionsTable)
    .where(
      and(
        eq(watchSessionsTable.id, Number(sessionId)),
        eq(watchSessionsTable.userId, userId),
        eq(watchSessionsTable.taskId, taskId),
      ),
    );

  if (!watchSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (watchSession.status === "completed") {
    return NextResponse.json({ completed: true });
  }

  const now = new Date();
  const lastCheckpoint = watchSession.lastCheckpointAt;
  const secondsSinceLast = lastCheckpoint
    ? Math.round((now.getTime() - lastCheckpoint.getTime()) / 1000)
    : 0;

  // Only credit time if the gap since last heartbeat is realistic (5–40s)
  const creditable =
    secondsSinceLast >= 5 && secondsSinceLast <= 40 ? secondsSinceLast : 0;

  const newAccumulated = (watchSession.accumulatedWatchTime || 0) + creditable;

  // Track wall-clock timestamps for heartbeat coverage checking
  const currentLog = (watchSession.heartbeatLog as number[]) || [];
  const newLog = [...currentLog, now.getTime()];

  const requiredSeconds = watchSession.videoDuration || 60;
  const isCompleted = newAccumulated >= Math.round(requiredSeconds * 0.85);

  await db
    .update(watchSessionsTable)
    .set({
      accumulatedWatchTime: newAccumulated,
      lastPositionSeconds: positionSeconds,
      lastCheckpointAt: now,
      heartbeatLog: newLog,
      status: isCompleted ? "completed" : "active",
      completedAt: isCompleted ? now : null,
    })
    .where(eq(watchSessionsTable.id, watchSession.id));

  return NextResponse.json({ completed: isCompleted, accumulated: newAccumulated });
}
