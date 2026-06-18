import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/src/services/task.service";

function isSafeRedirectUrl(url: string, origin: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return parsed.origin === origin;
  } catch {
    return false;
  }
}

/**
 * Get the real client IP — works across all deployment targets:
 *
 * Vercel:             x-vercel-forwarded-for  (set by Vercel's edge, trusted)
 * Cloudflare Tunnel:  cf-connecting-ip        (set by Cloudflare, trusted)
 * Generic proxy:      x-forwarded-for         (leftmost = original client)
 * Other:              x-real-ip
 *
 * Returns undefined (not "unknown") so the service skips IP dedup cleanly
 * instead of matching every headerless request against each other.
 */
function getRealIp(req: NextRequest): string | undefined {
  // Vercel sets this header with just the client IP (no proxy IPs appended)
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  // Cloudflare Tunnel sets this with the real client IP
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Standard proxy header — take leftmost (original client) address
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return undefined;
}

/**
 * Detect link-preview bots by User-Agent.
 * WhatsApp, Telegram, Slack, etc. pre-fetch URLs when you paste a link.
 * Those hits must NOT count as real clicks or they'll trigger duplicate-click
 * blocking before the actual user opens the link.
 */
function isLinkPreviewBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("whatsapp") ||
    ua.includes("telegrambot") ||
    ua.includes("slackbot") ||
    ua.includes("twitterbot") ||
    ua.includes("facebookexternalhit") ||
    ua.includes("linkedinbot") ||
    ua.includes("discordbot") ||
    ua.includes("applebot") ||
    ua.includes("iframely") ||
    ua.includes("unfurling") ||
    ua.includes("preview") ||
    ua.includes("crawler") ||
    ua.includes("bot/") ||
    ua.includes("+http") // generic bot convention
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareCode, fingerprint, userAgent } = body;

    // Block link-preview bots — WhatsApp pre-fetches the URL when you paste
    // it in a chat, which would falsely consume the click or trigger dedup
    // before a real person opens it.
    if (isLinkPreviewBot(userAgent)) {
      return NextResponse.json({ allowed: false, redirectUrl: "/" });
    }

    // Always derive IP server-side — never trust it from the request body.
    const ip = getRealIp(req);

    const result = await TaskService.handleShareClick(
      shareCode,
      fingerprint,
      ip,
      userAgent,
    );

    if (!result.success) {
      return NextResponse.json({ allowed: false, redirectUrl: "/" });
    }

    const redirectUrl = isSafeRedirectUrl(
      result.data.redirectUrl,
      req.nextUrl.origin,
    )
      ? result.data.redirectUrl
      : "/";

    return NextResponse.json({ ...result.data, redirectUrl });
  } catch (error) {
    console.error("Share click error:", error);
    return NextResponse.json({ allowed: false, redirectUrl: "/" });
  }
}