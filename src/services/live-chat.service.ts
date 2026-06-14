import { YouTubeService } from "./youtube.service";
import { ServiceResult, ok, fail } from "./result";

let cachedLiveChatId: { youtubeId: string; liveChatId: string } | null = null;

export async function fetchLiveChatId(youtubeId: string): Promise<ServiceResult<string>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return fail("YouTube API key not configured", 500);
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${youtubeId}&key=${apiKey}`
  );
  const data = await res.json();
  const item = data?.items?.[0];
  console.log("[live-chat] full liveStreamingDetails:", JSON.stringify(item?.liveStreamingDetails));
  console.log("[live-chat] activeLiveChatId:", item?.liveStreamingDetails?.activeLiveChatId);
  console.log("[live-chat] liveChatId:", item?.liveStreamingDetails?.liveChatId);
  if (data?.error) {
    const reason = data.error.errors?.[0]?.reason;
    const msg = data.error.message || "YouTube API error";
    console.error("[live-chat] YouTube API error:", reason, msg);
    if (reason === "accessNotConfigured") {
      return fail("YouTube Data API is not enabled for this API key", 500);
    }
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      return fail("YouTube API quota exceeded. Try again later.", 429);
    }
    if (reason === "keyInvalid") {
      return fail("YouTube API key is invalid", 500);
    }
    return fail(msg, res.status);
  }

  const details = data?.items?.[0]?.liveStreamingDetails;
  
  const liveChatId = details?.activeLiveChatId;
  return liveChatId ? ok(liveChatId) : fail("Live chat ID not found", 404);
}

async function getLiveChatId(youtubeId: string): Promise<ServiceResult<string>> {
  if (cachedLiveChatId?.youtubeId === youtubeId) {
    return ok(cachedLiveChatId.liveChatId);
  }

  try {
    const result = await fetchLiveChatId(youtubeId);
    if (result.success) {
      cachedLiveChatId = { youtubeId, liveChatId: result.data };
      return result;
    }

    // liveChatId not found — retry once after 3s (timing edge case)
    if (result.status === 404) {
      console.warn("[live-chat] liveChatId not found, retrying in 3s...");
      await new Promise((r) => setTimeout(r, 3000));
      const retry = await fetchLiveChatId(youtubeId);
      if (retry.success) {
        cachedLiveChatId = { youtubeId, liveChatId: retry.data };
        return retry;
      }
      return fail("Live chat is not available for this stream", 400);
    }

    return result;
  } catch {
    return fail("Failed to fetch live chat info", 500);
  }
}

export const LiveChatService = {
  async postMessage(
    userId: number,
    youtubeId: string,
    message: string,
  ): Promise<ServiceResult<boolean>> {
    const chatIdResult = await getLiveChatId(youtubeId);
    if (!chatIdResult.success) {
      return chatIdResult;
    }

    const tokenResult = await YouTubeService.getAuthorizedClient(userId);
    if (!tokenResult.success) {
      return tokenResult;
    }

    try {
      const res = await fetch(
        "https://youtube.googleapis.com/youtube/v3/liveChat/messages?part=snippet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResult.data}`,
          },
          body: JSON.stringify({
            snippet: {
              liveChatId: chatIdResult.data,
              type: "textMessageEvent",
              textMessageDetails: {
                messageText: message,
              },
            },
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        const reason = data?.error?.errors?.[0]?.reason;
        if (reason === "rateLimitExceeded" || reason === "liveChatRateLimitExceeded") {
          return fail("You're sending messages too fast. Please wait.", 429);
        }
        if (reason === "liveChatNotFound" || reason === "liveChatEnded") {
          cachedLiveChatId = null;
          return fail("The live stream has ended", 400);
        }
        return fail(data?.error?.message || "Failed to send message", 400);
      }

      return ok(true);
    } catch {
      return fail("Failed to send message", 500);
    }
  },

  clearCache() {
    cachedLiveChatId = null;
  },
};
