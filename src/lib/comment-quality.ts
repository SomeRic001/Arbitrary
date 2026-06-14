
export interface CommentQualityOptions {
    /** Minimum number of "real" words required outside the code. Default: 2 */
    minWords?: number;
    /** Minimum number of letters/digits required outside the code. Default: 6 */
    minChars?: number;
}

export interface CommentQualityResult {
    /** True if the code was found anywhere in the comment text. */
    hasCode: boolean;
    /**
     * True if, after removing the code, there's enough real text left
     * (before and/or after the code) to look like a genuine comment.
     */
    isQualityComment: boolean;
    /** The comment with the code, emojis & punctuation stripped out. */
    remainingText: string;
    /** Number of "real" words found outside the code. */
    wordCount: number;
}

const DEFAULT_MIN_WORDS = Number(process.env.COMMENT_QUALITY_MIN_WORDS) || 2;
const DEFAULT_MIN_CHARS = Number(process.env.COMMENT_QUALITY_MIN_CHARS) || 6;

// Covers most common emoji ranges + variation selectors + zero-width joiner.
const EMOJI_REGEX =
    /[\u{1F1E6}-\u{1FFFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

/**
 * Checks whether `commentText` contains `code` AND has meaningful text
 * besides the code (before and/or after it).
 *
 * Usage:
 *   const quality = checkCommentQuality(comment.message, code);
 *   if (quality.hasCode && quality.isQualityComment) { ...award points... }
 */
export function checkCommentQuality(
    commentText: string | null | undefined,
    code: string,
    options: CommentQualityOptions = {},
): CommentQualityResult {
    const minWords = options.minWords ?? DEFAULT_MIN_WORDS;
    const minChars = options.minChars ?? DEFAULT_MIN_CHARS;

    const text = (commentText ?? "").trim();

    if (!text || !code) {
        return { hasCode: false, isQualityComment: false, remainingText: "", wordCount: 0 };
    }

    const lowerText = text.toLowerCase();
    const lowerCode = code.toLowerCase();
    const codeIndex = lowerText.indexOf(lowerCode);

    if (codeIndex === -1) {
        return { hasCode: false, isQualityComment: false, remainingText: "", wordCount: 0 };
    }

    // Remove the code from the comment (whether it's at the start, end, or middle)
    // so we can inspect whatever text is left over.
    const before = text.slice(0, codeIndex);
    const after = text.slice(codeIndex + code.length);
    const withoutCode = `${before} ${after}`;

    // Strip emojis, then collapse anything that isn't a letter/number into
    // single spaces (this removes punctuation, hashtags' "#" symbol, etc.)
    const lettersOnly = withoutCode
        .replace(EMOJI_REGEX, " ")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    const words = lettersOnly.split(/\s+/).filter(Boolean);
    const charCount = words.join("").length;

    const isQualityComment = words.length >= minWords && charCount >= minChars;

    return {
        hasCode: true,
        isQualityComment,
        remainingText: lettersOnly,
        wordCount: words.length,
    };
}

/**
 * Friendly, user-facing message explaining why a code-only comment was
 * rejected. Re-used by both the Facebook and Instagram verifiers so the
 * wording stays consistent.
 */
export function buildLowQualityCommentMessage(code: string): string {
    return (
        `We found your code "${code}" in a comment, but the comment doesn't ` +
        `have much else in it. Comments that are *only* a code can get your ` +
        `account flagged as a bot. Please edit your comment to add a few ` +
        `words about the post (before or after the code), then tap Verify again.`
    );
}
