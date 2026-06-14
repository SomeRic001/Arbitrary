import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { watchSessionsTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/src/services/auth.service";

// PATCH — pause a watch session (preserve progress, just change status)
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
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(watchSessionsTable)
    .where(
      and(
        eq(watchSessionsTable.id, sessionId),
        eq(watchSessionsTable.userId, userId),
        eq(watchSessionsTable.taskId, taskId),
      ),
    );

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await db
    .update(watchSessionsTable)
    .set({ status: "paused" })
    .where(eq(watchSessionsTable.id, sessionId));

  return NextResponse.json({ success: true });
}
