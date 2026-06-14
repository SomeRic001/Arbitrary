import crypto from "crypto";
import { checkCommentQuality, type CommentQualityOptions } from "./comment-quality";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export interface Post {
    id: string;
    message: string;
    created_time: string;
    full_picture?: string;
    permalink_url?: string;
    likes?: { summary: { total_count: number } };
    comments?: { summary: { total_count: number } };
    shares?: { summary: { total_count: number } };
}

export interface LikeCheckResult {
    liked: boolean
    userId: string;
    postId: string;
    checkedAt: string;
    error?: string;
    /** The full text of the matching comment, if one was found. */
    commentText?: string;
    /**
     * True if the matching comment contains more than just the bare
     * verification code (i.e. it looks like a genuine human comment).
     * Only present when `liked` is true.
     */
    hasQualityComment?: boolean;
}

/** Generate a deterministic verification code for a user+task combination */
export function getVerificationCode(userId: number, taskId: number, prefix: string = '#fb'): string {
    const date = new Date().toISOString().slice(0, 10);
    const secret = process.env.YOUTUBE_CHALLENGE_SECRET || process.env.NEXTAUTH_SECRET || "";
    return `${prefix}${crypto
        .createHash("sha256")
        .update(`${date}:${userId}:${taskId}:${secret}`)
        .digest("hex")
        .slice(0, 8)}`;
}

export async function getPagePosts(): Promise<Post[]> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !token) {
        throw new Error("FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN is missing from .env");
    }

    const url = new URL(`${GRAPH_API_BASE}/${pageId}/posts`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("fields", "id,message,created_time,full_picture,permalink_url,likes.summary(true)");
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    const data = await res.json();

    if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
    }

    return data.data as Post[];
}

export async function findCodeInComments(
    postId: string,
    code: string,
    qualityOptions?: CommentQualityOptions,
): Promise<LikeCheckResult> {
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageToken) {
        return { liked: false, userId: "", postId, checkedAt: new Date().toISOString(), error: "FACEBOOK_PAGE_ACCESS_TOKEN is missing from .env" };
    }

    const url = new URL(`${GRAPH_API_BASE}/${postId}/comments`);
    url.searchParams.set("access_token", pageToken);
    url.searchParams.set("limit", "1000");
    url.searchParams.set("fields", "from,message,created_time");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
        return { liked: false, userId: "", postId, checkedAt: new Date().toISOString(), error: data.error.message };
    }

    const match = Array.isArray(data.data)
        ? data.data.find((c: { message?: string }) => c.message && c.message.includes(code))
        : undefined;

    if (!match) {
        return { liked: false, userId: code, postId, checkedAt: new Date().toISOString() };
    }

    const quality = checkCommentQuality(match.message, code, qualityOptions);

    return {
        liked: true,
        userId: code,
        postId,
        checkedAt: new Date().toISOString(),
        commentText: match.message,
        hasQualityComment: quality.isQualityComment,
    };
}

export async function checkUserCommentedOnPost(
    postId: string,
    _userAccessToken: string,
    asid: string,
    code?: string,
    qualityOptions?: CommentQualityOptions,
): Promise<LikeCheckResult> {
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageToken) {
        return { liked: false, userId: asid, postId, checkedAt: new Date().toISOString(), error: "FACEBOOK_PAGE_ACCESS_TOKEN is missing from .env" };
    }

    const url = new URL(`${GRAPH_API_BASE}/${postId}/comments`);
    url.searchParams.set("access_token", pageToken);
    url.searchParams.set("limit", "1000");
    url.searchParams.set("fields", "from,message,created_time");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
        return { liked: false, userId: asid, postId, checkedAt: new Date().toISOString(), error: data.error.message };
    }

    const match = Array.isArray(data.data)
        ? data.data.find(
            (comment: { from?: { id: string }; message?: string }) => comment.from?.id?.toString() === asid.toString(),
        )
        : undefined;

    if (!match) {
        return { liked: false, userId: asid, postId, checkedAt: new Date().toISOString() };
    }

    // If no code was supplied, fall back to the old behaviour: any comment
    // from this user on the post counts.
    if (!code) {
        return { liked: true, userId: asid, postId, checkedAt: new Date().toISOString(), commentText: match.message };
    }

    const hasCode = !!match.message && match.message.includes(code);
    const quality = checkCommentQuality(match.message, code, qualityOptions);

    return {
        liked: hasCode,
        userId: asid,
        postId,
        checkedAt: new Date().toISOString(),
        commentText: match.message,
        hasQualityComment: hasCode && quality.isQualityComment,
    };
}
