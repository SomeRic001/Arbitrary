import { checkCommentQuality, type CommentQualityOptions } from "./comment-quality";

interface InstagramMedia {
    id: string;
    caption: string | null;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
}

interface InstagramComment {
    id: string;
    text: string;
    username: string;
}

export class InstagramService {
    private static accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    private static userId = process.env.INSTAGRAM_USER_ID;
    private static baseUrl = 'https://graph.facebook.com/v19.0';

    /**
     * Fetch recent media from the Instagram account
     */
    static async getInstagramMedia() {
        if (!this.accessToken || !this.userId) {
            throw new Error('Instagram API credentials missing in environment variables');
        }

        try {
            const url = new URL(`${this.baseUrl}/${this.userId}/media`);
            url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink');
            url.searchParams.set('access_token', this.accessToken);

            const response = await fetch(url.toString());
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `Instagram API error: ${response.status}`);
            }
            const data = await response.json();
            return data.data as InstagramMedia[];
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error fetching Instagram media:', msg);
            throw error;
        }
    }

    /**
     * Check if a verification code appears in any comment on the media post.
     */
    static async findCodeInComments(
        mediaId: string,
        code: string,
        expectedUsername: string,
        qualityOptions?: CommentQualityOptions,
    ) {
        if (!this.accessToken) {
            throw new Error('Instagram API access token missing');
        }

        const url = new URL(`${this.baseUrl}/${mediaId}/comments`);
        url.searchParams.set('fields', 'id,text,username');
        url.searchParams.set('access_token', this.accessToken);
        url.searchParams.set('limit', '1000');

        const response = await fetch(url.toString());
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Instagram API error: ${response.status}`);
        }

        const json = await response.json() as { data: InstagramComment[] };

        const match = (json.data || []).find(comment => {
            const containsCode = comment.text?.toLowerCase().includes(code.toLowerCase());
            const usernameMatches = comment.username.toLowerCase() === expectedUsername.toLowerCase();
            return containsCode && usernameMatches;
        });

        if (!match) {
            return { found: false as const };
        }

        const quality = checkCommentQuality(match.text, code, qualityOptions);

        return {
            found: true as const,
            commentId: match.id,
            commentText: match.text,
            hasQualityComment: quality.isQualityComment,
        };
    }
}
