// src/app/api/tilde/me/route.ts
// Returns the current authenticated Tilde user + any existing registration.
// Used by /tilde page to pre-fill the form and check auth without relying on httpOnly cookie directly.

import { NextRequest, NextResponse } from 'next/server';
import { tildeDb } from '@/src/db/tilde-db';
import { tildeUsersTable, tildeRegistrationsTable } from '@/src/db/tilde-schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const TILDE_JWT_SECRET = new TextEncoder().encode(
    process.env.TILDE_JWT_SECRET ?? 'tilde-fallback-secret-change-in-production'
);

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('tilde_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        let payload: { id: number; email: string; name: string };
        try {
            const { payload: p } = await jwtVerify(token, TILDE_JWT_SECRET);
            payload = p as typeof payload;
        } catch {
            return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }

        // Fetch existing registration if any
        const [registration] = await tildeDb
            .select()
            .from(tildeRegistrationsTable)
            .where(eq(tildeRegistrationsTable.userId, payload.id));

        return NextResponse.json({
            user: { id: payload.id, name: payload.name, email: payload.email },
            registration: registration
                ? {
                    name: registration.name,
                    email: registration.email,
                    phone: registration.phone,
                    address: registration.address,
                }
                : null,
        });
    } catch (err) {
        console.error('[tilde/me]', err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}