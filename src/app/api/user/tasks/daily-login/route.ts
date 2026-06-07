import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { TaskService } from "@/src/services/task.service";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = await rateLimit(`daily-login:${auth.data.id}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const { taskId } = await req.json();
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const result = await TaskService.claimDailyLogin(auth.data.id, taskId);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: (result as any).status ?? 400 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
