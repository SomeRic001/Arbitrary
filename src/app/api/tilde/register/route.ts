// src/app/api/tilde/register/route.ts
// Saves (or updates) the event registration form at /tilde.
// Requires a valid tilde_token cookie — rejects unauthenticated requests.
// Uses upsert: one registration per user (insert or update on conflict).

import { NextRequest, NextResponse } from 'next/server';
import { tildeDb } from '@/src/db/tilde-db';
import { tildeRegistrationsTable } from '@/src/db/tilde-schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const TILDE_JWT_SECRET = new TextEncoder().encode(
    process.env.TILDE_JWT_SECRET ?? 'tilde-fallback-secret-change-in-production'
);

export async function POST(req: NextRequest) {
    try {
        // ── Auth check ─────────────────────────────────────────────────────
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

        // ── Body validation ────────────────────────────────────────────────
        const { name, email, phone, address } = await req.json();
        if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim()) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        // ── Upsert: check if a registration already exists for this user ───
        const [existing] = await tildeDb
            .select({ id: tildeRegistrationsTable.id })
            .from(tildeRegistrationsTable)
            .where(eq(tildeRegistrationsTable.userId, payload.id));

        if (existing) {
            // Update existing registration
            await tildeDb
                .update(tildeRegistrationsTable)
                .set({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                })
                .where(eq(tildeRegistrationsTable.id, existing.id));
        } else {
            // Insert new registration
            await tildeDb.insert(tildeRegistrationsTable).values({
                userId: payload.id,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
            });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error('[tilde/register]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}