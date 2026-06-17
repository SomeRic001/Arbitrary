import { eq } from 'drizzle-orm';
import { tiltDb } from '@/src/db/tilt-db';
import { lotterySessionsTable } from '@/src/db/tilt-schema';

export type LotterySession = {
    id: string;
    token_id: string;
    campaign_id: string;
    submitted_at: Date | null;
    created_at: Date;
};

type CookieStoreLike = {
    get(name: string): { value: string } | undefined;
};

export async function getSessionFromCookie(
    cookieStore: CookieStoreLike,
): Promise<LotterySession | null> {
    const sessionId = cookieStore.get('lsid')?.value?.trim();
    if (!sessionId) {
        return null;
    }

    const [session] = await tiltDb
        .select({
            id: lotterySessionsTable.id,
            token_id: lotterySessionsTable.tokenId,
            campaign_id: lotterySessionsTable.campaignId,
            submitted_at: lotterySessionsTable.submittedAt,
            created_at: lotterySessionsTable.createdAt,
        })
        .from(lotterySessionsTable)
        .where(eq(lotterySessionsTable.id, sessionId));

    return session ?? null;
}
