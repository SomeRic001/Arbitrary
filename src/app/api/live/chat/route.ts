import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { AboutService } from "@/src/services/about.service";
import { LiveChatService } from "@/src/services/live-chat.service";
import { rateLimit } from "@/src/lib/rate-limit";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(200, "Message too long"),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: "Sign in to send messages" }, { status: 401 });
  }

  const userId = auth.data.id;
  const rl = await rateLimit(`livechat:${userId}`, 1, 30_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "You're sending messages too fast. Please wait." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const streamResult = await AboutService.getLiveStreamId();
  if (!streamResult.success || !streamResult.data) {
    return NextResponse.json({ error: "No live stream is currently active" }, { status: 400 });
  }

  const result = await LiveChatService.postMessage(userId, streamResult.data, parsed.data.message);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
