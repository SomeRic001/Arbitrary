import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/src/services/task.service";
import { requireUser } from "@/src/services/auth.service";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`set-owner-fingerprint:${auth.data.id}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  try {
    const { shareCode, fingerprint } = await req.json();

    if (!shareCode || !fingerprint) {
      return NextResponse.json({ ok: false });
    }

    const result = await TaskService.setOwnerFingerprint(auth.data.id, shareCode, fingerprint);
    return NextResponse.json({ ok: result.success });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
