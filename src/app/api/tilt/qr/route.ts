import { NextRequest, NextResponse } from 'next/server';
import { GenerateQrTokenError, generateQrToken } from '@/src/lib/tilt/generate-qr-token';

type ErrorResponse = {
    error: string;
    code: string;
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));

        const campaignId = typeof body?.campaign_id === 'string' ? body.campaign_id.trim() : '';
        const outletId = typeof body?.outlet_id === 'string' ? body.outlet_id.trim() : '';

        if (!campaignId || !outletId) {
            const response: ErrorResponse = {
                error: 'Missing campaign_id or outlet_id',
                code: 'BAD_REQUEST',
            };
            return NextResponse.json(response, { status: 400 });
        }

        // Intentionally NOT idempotent: one QR per sale, each call creates a new token by design.
        const { token, expiresAt } = await generateQrToken(campaignId, outletId);

        return NextResponse.json(
            {
                token,
                qr_url: `${process.env.NEXT_PUBLIC_APP_URL}/redeem?t=${token}`,
                expires_at: expiresAt,
            },
            { status: 200 },
        );
    } catch (error) {
        if (error instanceof GenerateQrTokenError) {
            if (error.code === 'NOT_FOUND') {
                const response: ErrorResponse = { error: 'Campaign not found', code: 'NOT_FOUND' };
                return NextResponse.json(response, { status: 404 });
            }

            if (error.code === 'CAMPAIGN_INACTIVE') {
                const response: ErrorResponse = { error: 'Campaign not active', code: 'CAMPAIGN_INACTIVE' };
                return NextResponse.json(response, { status: 400 });
            }
        }

        console.error('[tilt/qr]', error);
        const response: ErrorResponse = { error: 'Something went wrong', code: 'INTERNAL_ERROR' };
        return NextResponse.json(response, { status: 500 });
    }
}
