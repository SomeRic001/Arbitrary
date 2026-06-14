import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { TaskService } from "@/src/services/task.service";
import { toNextResponse } from "@/src/lib/api-response";
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

  const result = await TaskService.claimDailyLogin(auth.data.id);
  if (!result.success) return toNextResponse(result);

  return NextResponse.json(result.data, { status: 200 });
}