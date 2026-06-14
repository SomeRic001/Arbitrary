// src/lib/social/types.ts
// Central types for all social media platforms — add new platforms here

export type Platform = "facebook" | "instagram" | "youtube";

export interface SocialPost {
    id: string;            // platform-specific post ID
    platform: Platform;
    title: string;         // normalized title / caption
    thumbnailUrl?: string; // preview image
    url: string;           // link to the post
    likeCount?: number;
    publishedAt: string;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
};

export const PLATFORM_COLORS: Record<Platform, { bg: string; text: string; border: string }> = {
    facebook: { bg: "#1877F2", text: "#fff", border: "#1877F2" },
    instagram: { bg: "linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)", text: "#fff", border: "#E1306C" },
    youtube: { bg: "#FF0000", text: "#fff", border: "#FF0000" },
};
