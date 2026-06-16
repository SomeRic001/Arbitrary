// src/app/api/tilt/register/route.ts
// Saves (or updates) the event registration form at /tilt.
// Requires a valid tilt_token cookie — rejects unauthenticated requests.
// Uses upsert: one registration per user (insert or update on conflict).

import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltRegistrationsTable } from '@/src/db/tilt-schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const tilt_JWT_SECRET = new TextEncoder().encode(
    process.env.tilt_JWT_SECRET ?? 'tilt-fallback-secret-change-in-production'
);

export async function POST(req: NextRequest) {
    try {
        // ── Auth check ─────────────────────────────────────────────────────
        const token = req.cookies.get('tilt_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        let payload: { id: number; email: string; name: string };
        try {
            const { payload: p } = await jwtVerify(token, tilt_JWT_SECRET);
            payload = p as typeof payload;
        } catch {
            return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }

        // ── Body validation ────────────────────────────────────────────────
        const { name, email, phone, address } = await req.json();
        if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim()) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        // ── Upsert: check if a registration already exists for this user ───
        const [existing] = await tiltDb
            .select({ id: tiltRegistrationsTable.id })
            .from(tiltRegistrationsTable)
            .where(eq(tiltRegistrationsTable.userId, payload.id));

        if (existing) {
            // Update existing registration
            await tiltDb
                .update(tiltRegistrationsTable)
                .set({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                })
                .where(eq(tiltRegistrationsTable.id, existing.id));
        } else {
            // Insert new registration
            await tiltDb.insert(tiltRegistrationsTable).values({
                userId: payload.id,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
            });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error('[tilt/register]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}