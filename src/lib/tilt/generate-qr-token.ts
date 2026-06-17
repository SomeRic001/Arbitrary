import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { tiltDb } from '@/src/db/tilt-db';
import { lotteryCampaignsTable, qrTokensTable } from '@/src/db/tilt-schema';

export type GenerateQrTokenErrorCode = 'NOT_FOUND' | 'CAMPAIGN_INACTIVE';

export class GenerateQrTokenError extends Error {
    readonly code: GenerateQrTokenErrorCode;

    constructor(code: GenerateQrTokenErrorCode, message: string) {
        super(message);
        this.name = 'GenerateQrTokenError';
        this.code = code;
    }
}

function isUniqueViolation(error: unknown): boolean {
    const maybeError = error as { code?: string; cause?: { code?: string } };
    return maybeError?.code === '23505' || maybeError?.cause?.code === '23505';
}

export async function generateQrToken(campaignId: string, outletId: string) {
    const [campaign] = await tiltDb
        .select({
            id: lotteryCampaignsTable.id,
            startsAt: lotteryCampaignsTable.startsAt,
            endsAt: lotteryCampaignsTable.endsAt,
        })
        .from(lotteryCampaignsTable)
        .where(eq(lotteryCampaignsTable.id, campaignId));

    if (!campaign) {
        throw new GenerateQrTokenError('NOT_FOUND', 'Campaign not found');
    }

    const now = new Date();
    if (campaign.startsAt > now || campaign.endsAt < now) {
        throw new GenerateQrTokenError('CAMPAIGN_INACTIVE', 'Campaign not active');
    }

    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const token = nanoid(32);

        try {
            await tiltDb.insert(qrTokensTable).values({
                campaignId,
                outletId,
                token,
                expiresAt,
            });

            return { token, expiresAt };
        } catch (error) {
            const canRetry = attempt === 0 && isUniqueViolation(error);
            if (!canRetry) {
                throw error;
            }
        }
    }

    throw new Error('Failed to generate QR token after retry');
}
