import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { userTasksTable, tasksTable } from "@/src/db/schema";
import { and, eq, inArray } from "drizzle-orm";

/**
 * POST /api/cron/reset-daily-tasks
 *
 * Runs at 12:00 AM UTC every day (configure in your cron provider).
 * Deletes all userTasksTable rows for recurring (isRecurring = true) tasks
 * that are in a terminal state (Completed, Verified, Cancelled) so they
 * appear as available again for the new day.
 *
 * Historical data is preserved in dailyTaskCompletionsTable — this route
 * only clears the "active session" rows in userTasksTable.
 *
 * Protect with CRON_SECRET env variable. Pass it as:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel cron example (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/reset-daily-tasks", "schedule": "0 0 * * *" }]
 * }
 */
export async function POST(req: NextRequest) {
    // ── Auth: verify cron secret ──
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        // 1. Find all recurring task IDs
        const recurringTasks = await db
            .select({ id: tasksTable.id })
            .from(tasksTable)
            .where(eq(tasksTable.isRecurring, true));

        if (recurringTasks.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No recurring tasks found. Nothing to reset.",
                deletedRows: 0,
            });
        }

        const recurringTaskIds = recurringTasks.map((t) => t.id);

        // 2. Delete only terminal-state rows for recurring tasks.
        //    "Pending" / "In Progress" rows are kept — if a user picked up a
        //    task just before midnight and hasn't submitted yet, they can still
        //    complete it. Only Completed, Verified, and Cancelled rows are reset.
        const deleted = await db
            .delete(userTasksTable)
            .where(
                and(
                    inArray(userTasksTable.taskId, recurringTaskIds),
                    inArray(userTasksTable.status, ["Completed", "Verified", "Cancelled"]),
                ),
            )
            .returning({ id: userTasksTable.id });

        const now = new Date().toISOString();

        console.log(
            `[cron/reset-daily-tasks] ${now} — reset ${deleted.length} rows across ${recurringTaskIds.length} recurring tasks`,
        );

        return NextResponse.json({
            success: true,
            resetAt: now,
            recurringTaskCount: recurringTaskIds.length,
            deletedRows: deleted.length,
        });
    } catch (err) {
        console.error("[cron/reset-daily-tasks] Error:", err);
        return NextResponse.json(
            { error: "Internal server error during daily task reset" },
            { status: 500 },
        );
    }
}

// Also support GET for easy manual triggering from the browser (dev only)
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Use POST in production" },
            { status: 405 },
        );
    }
    return POST(req);
}