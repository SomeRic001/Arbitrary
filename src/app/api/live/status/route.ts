import { NextResponse } from "next/server";
import { AboutService } from "@/src/services/about.service";
import { fetchLiveChatId } from "@/src/services/live-chat.service";

export const revalidate = 0;

export async function GET() {
  const result = await AboutService.getLiveStreamId();
  if (!result.success || !result.data) {
    return NextResponse.json(
      { live: false, youtubeId: null, chatAvailable: false },
      { status: 200 },
    );
  }

  const youtubeId = result.data;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${youtubeId}&key=${apiKey}`,
      );
      const data = await res.json();
      const details = data?.items?.[0]?.liveStreamingDetails;
      if (details?.actualEndTime) {
        await AboutService.setLiveStreamId(null);
        return NextResponse.json(
          { live: false, youtubeId: null, chatAvailable: false },
          { status: 200 },
        );
      }
    } catch {
      console.error(
        "[live/status] YouTube API check failed, falling back to stored ID",
      );
    }
  }

  // Determine if chat is available
  let chatAvailable = false;
  const chatResult = await fetchLiveChatId(youtubeId);
  if (chatResult.success) {
    chatAvailable = true;
  } else if (chatResult.status === 404) {
    // Chat not available
    console.warn("Live chat id not found for youtubeId:", youtubeId);
  } else if (chatResult.status === 500) {
    // Config/quota error — still mark as live but log it
    console.error("[live/status] Chat unavailable:", chatResult.error);
  }

  return NextResponse.json(
    { live: true, youtubeId, chatAvailable },
    { status: 200 },
  );
}
