import { and, eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { lotterySessionsTable, qrTokensTable } from '@/src/db/tilt-schema';

const FORM_PATH = '/lottery/form';
const INVALID_PATH = '/lottery/invalid';

class LostRedeemRaceError extends Error {
    constructor() {
        super('Token was already consumed by another request');
        this.name = 'LostRedeemRaceError';
    }
}

function redirectTo(req: NextRequest, path: string) {
    return NextResponse.redirect(new URL(path, req.url));
}

function redirectInvalid(req: NextRequest, reason: string) {
    return redirectTo(req, `${INVALID_PATH}?reason=${reason}`);
}

function redirectToFormWithSession(req: NextRequest, sessionId: string) {
    const response = redirectTo(req, FORM_PATH);
    response.cookies.set('lsid', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1800,
        path: '/',
    });
    return response;
}

export async function GET(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get('t')?.trim();

        if (!token) {
            return redirectInvalid(req, 'missing_token');
        }

        const [tokenRow] = await tiltDb
            .select({
                id: qrTokensTable.id,
                campaignId: qrTokensTable.campaignId,
                expiresAt: qrTokensTable.expiresAt,
                usedAt: qrTokensTable.usedAt,
                sessionId: qrTokensTable.sessionId,
            })
            .from(qrTokensTable)
            .where(eq(qrTokensTable.token, token));

        if (!tokenRow) {
            return redirectInvalid(req, 'not_found');
        }

        const now = new Date();
        if (tokenRow.expiresAt < now) {
            return redirectInvalid(req, 'expired');
        }

        if (tokenRow.usedAt) {
            if (tokenRow.sessionId) {
                return redirectToFormWithSession(req, tokenRow.sessionId);
            }
            return redirectInvalid(req, 'already_used');
        }

        const newSessionId = nanoid();
        const burnedAt = new Date();

        await tiltDb.transaction(async (tx) => {
            const burnedRows = await tx
                .update(qrTokensTable)
                .set({
                    usedAt: burnedAt,
                    sessionId: newSessionId,
                })
                .where(and(eq(qrTokensTable.token, token), isNull(qrTokensTable.usedAt)))
                .returning({ id: qrTokensTable.id });

            if (burnedRows.length === 0) {
                throw new LostRedeemRaceError();
            }

            await tx.insert(lotterySessionsTable).values({
                id: newSessionId,
                tokenId: tokenRow.id,
                campaignId: tokenRow.campaignId,
            });
        });

        return redirectToFormWithSession(req, newSessionId);
    } catch (error) {
        if (error instanceof LostRedeemRaceError) {
            return redirectInvalid(req, 'already_used');
        }

        console.error('[tilt/redeem]', error);
        return redirectInvalid(req, 'server_error');
    }
}
