/**
 * Single source of truth for YouTube URL validation / video-ID extraction.
 * Imported by BOTH the Zod validation schema (server) and the client-side
 * UI (admin form preview, public event detail embed) so behavior can never
 * drift between the two — never duplicate this logic elsewhere.
 *
 * Mirrors the pattern used by `parseSocialUrl` in `social-url.ts`.
 */

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts an 11-character YouTube video ID from a URL.
 * Supports:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *
 * Returns null for empty, malformed, or non-YouTube URLs — callers should
 * treat null as "fall back to the default behavior" (e.g. show the image).
 */
export function extractYouTubeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/shorts/")) {
      id = url.pathname.split("/")[2] || null;
    } else if (url.pathname.startsWith("/embed/")) {
      id = url.pathname.split("/")[2] || null;
    }
  } else {
    return null;
  }

  if (!id || !YT_ID_REGEX.test(id)) return null;
  return id;
}

/** True if the given string is a YouTube URL we can confidently embed. */
export function isValidYouTubeUrl(raw: string | null | undefined): boolean {
  return extractYouTubeId(raw) !== null;
}

/** Builds a privacy-friendlier embeddable URL for a known-good video ID.
 *  Pass `extraParams` to opt into additional embed query params (e.g.
 *  `{ enablejsapi: "1" }` for IFrame API playback-state events) without
 *  changing the default behavior for existing callers like the admin preview. */
export function youtubeEmbedUrl(
  videoId: string,
  extraParams?: Record<string, string>,
): string {
  const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
  if (!extraParams || Object.keys(extraParams).length === 0) return base;
  const qs = new URLSearchParams(extraParams).toString();
  return `${base}?${qs}`;
}
