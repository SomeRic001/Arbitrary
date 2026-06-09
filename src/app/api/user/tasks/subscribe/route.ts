import { NextRequest } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { db } from "@/src/db";
import { userTasksTable, tasksTable } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = auth.data.id;
  let lastSnapshot = new Map<number, string>();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`:connected\n\n`));

      const poll = async () => {
        try {
          const rows = await db
            .select({
              id: userTasksTable.id,
              taskId: userTasksTable.taskId,
              status: userTasksTable.status,
              taskTitle: tasksTable.title,
            })
            .from(userTasksTable)
            .innerJoin(tasksTable, eq(userTasksTable.taskId, tasksTable.id))
            .where(
              and(
                eq(userTasksTable.userId, userId),
                sql`LOWER(${userTasksTable.status}) IN ('pending verification', 'verified', 'completed', 'rejected')`,
              ),
            );

          const changes: Array<{
            userTaskId: number;
            taskId: number;
            status: string;
            taskTitle: string;
          }> = [];

          const currentSnapshot = new Map<number, { status: string; taskTitle: string }>();
          for (const row of rows) {
            const prev = lastSnapshot.get(row.id);
            currentSnapshot.set(row.id, { status: row.status, taskTitle: row.taskTitle ?? "" });

            if (prev !== undefined && prev !== row.status) {
              changes.push({
                userTaskId: row.id,
                taskId: row.taskId!,
                status: row.status,
                taskTitle: row.taskTitle ?? "",
              });
            }

            if (prev === undefined) {
              lastSnapshot.set(row.id, row.status);
            }
          }

          lastSnapshot = new Map(
            Array.from(currentSnapshot.entries()).map(([id, v]) => [id, v.status]),
          );

          if (changes.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "status_change", changes })}\n\n`),
            );
          } else {
            controller.enqueue(encoder.encode(`:heartbeat\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode(`:poll_error\n\n`));
        }
      };

      const interval = setInterval(poll, 4000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
