// src/app/api/tilt/me/route.ts
// Returns the current authenticated tilt user + any existing registration.
// Used by /tilt page to pre-fill the form and check auth without relying on httpOnly cookie directly.

import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltUsersTable, tiltRegistrationsTable } from '@/src/db/tilt-schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const TILT_JWT_SECRET = new TextEncoder().encode(
    process.env.TILT_JWT_SECRET ?? 'tilt-fallback-secret-change-in-production'
);

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('tilt_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        let payload: { id: number; email: string; name: string,role: string };
        try {
            const { payload: p } = await jwtVerify(token, TILT_JWT_SECRET);
            payload = p as typeof payload;
        } catch {
            return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }

        // Fetch existing registration if any
        const [registration] = await tiltDb
            .select()
            .from(tiltRegistrationsTable)
            .where(eq(tiltRegistrationsTable.userId, payload.id));

        return NextResponse.json({
            user: { id: payload.id, name: payload.name, email: payload.email,role:payload.role },
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
        console.error('[tilt/me]', err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}