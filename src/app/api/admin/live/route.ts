import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { AboutService } from "@/src/services/about.service";

const YT_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/|^)([A-Za-z0-9_-]{11})/;

function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(YT_ID_REGEX);
  return match ? match[1] : null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await AboutService.getLiveStreamId();
  if (!result.success) {
    return NextResponse.json({ live: false, youtubeId: null });
  }
  return NextResponse.json({
    live: !!result.data,
    youtubeId: result.data,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.clear) {
    await AboutService.setLiveStreamId(null);
    return NextResponse.json({ success: true, live: false });
  }

  if (!body.youtubeUrl) {
    return NextResponse.json({ error: "youtubeUrl is required" }, { status: 400 });
  }

  const id = extractYoutubeId(body.youtubeUrl);
  if (!id) {
    return NextResponse.json(
      { error: "Invalid YouTube URL. Please provide a valid YouTube video or live stream link." },
      { status: 400 },
    );
  }

  await AboutService.setLiveStreamId(id);
  return NextResponse.json({ success: true, live: true, youtubeId: id });
}
