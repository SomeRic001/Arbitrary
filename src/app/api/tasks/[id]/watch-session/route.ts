import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { tasksTable, watchSessionsTable, usersTable } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireUser } from "@/src/services/auth.service";

const HEARTBEAT_INTERVAL_SECONDS = 30;
const MAX_GAP_SECONDS = 60;

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

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.taskType, "video_watch")));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const videoDuration = task.watchDuration || 30;

  const [session] = await db
    .insert(watchSessionsTable)
    .values({
      userId: auth.data.id,
      taskId,
      videoDuration,
      lastCheckpointAt: new Date(),
    })
    .returning();

  return NextResponse.json({
    sessionId: session.id,
    videoDuration,
    requiredSeconds: Math.round(videoDuration * 0.85),
    completed: false,
  });
}

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

  const body = await req.json();
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(watchSessionsTable)
    .where(
      and(
        eq(watchSessionsTable.id, sessionId),
        eq(watchSessionsTable.userId, auth.data.id),
        eq(watchSessionsTable.taskId, taskId),
      ),
    )
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "Watch session not found" }, { status: 404 });
  }

  if (session.completedAt || session.status !== "active") {
    return NextResponse.json({ error: "Watch session already completed" }, { status: 400 });
  }

  const now = Date.now();
  const lastHeartbeat = session.lastCheckpointAt
    ? new Date(session.lastCheckpointAt).getTime()
    : new Date(session.createdAt ?? now).getTime();
  const gapSeconds = Math.round((now - lastHeartbeat) / 1000);

  // Validate gap: shouldn't be too short (cheating) or too long (paused)
  if (gapSeconds < 5) {
    return NextResponse.json({
      error: "Heartbeat too frequent",
      retryAfterSeconds: HEARTBEAT_INTERVAL_SECONDS,
    }, { status: 429 });
  }

  if (gapSeconds > MAX_GAP_SECONDS) {
    return NextResponse.json({
      error: `Heartbeat gap of ${gapSeconds}s exceeds maximum allowed (${MAX_GAP_SECONDS}s). Keep watching steadily.`,
    }, { status: 429 });
  }

  const creditedSeconds = Math.min(gapSeconds, HEARTBEAT_INTERVAL_SECONDS);
  const heartbeatLog = (session.heartbeatLog as number[]) || [];
  heartbeatLog.push(Math.round(now / 1000));

  const newAccumulated = session.accumulatedWatchTime + creditedSeconds;
  const videoDuration = session.videoDuration || 30;
  const requiredAccumulated = Math.round(videoDuration * 0.85);
  const expectedIntervals = Math.ceil(videoDuration / HEARTBEAT_INTERVAL_SECONDS);
  const isCompleted = newAccumulated >= requiredAccumulated &&
    heartbeatLog.length >= Math.ceil(expectedIntervals * 0.75);

  await db
    .update(watchSessionsTable)
    .set({
      accumulatedWatchTime: newAccumulated,
      lastPositionSeconds: Math.min(session.lastPositionSeconds + creditedSeconds, videoDuration),
      lastCheckpointAt: new Date(),
      heartbeatLog,
      completedAt: isCompleted ? new Date() : null,
      status: isCompleted ? "completed" : "active",
    })
    .where(eq(watchSessionsTable.id, session.id));

  return NextResponse.json({
    accumulatedWatchTime: newAccumulated,
    requiredAccumulated,
    coverage: `${heartbeatLog.length}/${expectedIntervals}`,
    completed: isCompleted,
    creditedSeconds,
  });
}
