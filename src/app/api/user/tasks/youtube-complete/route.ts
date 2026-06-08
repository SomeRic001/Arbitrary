import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { TaskService } from "@/src/services/task.service";
import { youtubeCompleteSchema } from "@/src/lib/validations/task";
import { toNextResponse } from "@/src/lib/api-response";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = await rateLimit(`youtube-complete:${auth.data.id}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const parsed = youtubeCompleteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { taskId, sessionId, fingerprint } = parsed.data;
  const result = await TaskService.completeYoutubeTask(
    auth.data.id,
    Number(taskId),
    sessionId ?? undefined,
    fingerprint,
  );
  if (!result.success) return toNextResponse(result);

  return NextResponse.json(result.data, { status: 200 });
}
