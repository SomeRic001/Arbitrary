// src/app/api/tilt/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltUsersTable } from '@/src/db/tilt-schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const TILT_JWT_SECRET = new TextEncoder().encode(
    process.env.TILT_JWT_SECRET ?? 'tilt-fallback-secret-change-in-production'
);

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // ── Basic validation ───────────────────────────────────────────────
        if (!name?.trim() || !email?.trim() || !password) {
            return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        // ── Check duplicate email ──────────────────────────────────────────
        const [existing] = await tiltDb
            .select({ id: tiltUsersTable.id })
            .from(tiltUsersTable)
            .where(eq(tiltUsersTable.email, email.toLowerCase().trim()));

        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }

        // ── Hash password & insert ─────────────────────────────────────────
        const passwordHash = await bcrypt.hash(password, 12);

        const [user] = await tiltDb
            .insert(tiltUsersTable)
            .values({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash })
            .returning({ id: tiltUsersTable.id, name: tiltUsersTable.name, email: tiltUsersTable.email });

        // ── Issue JWT ──────────────────────────────────────────────────────
        const token = await new SignJWT({ id: user.id, email: user.email, name: user.name })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(TILT_JWT_SECRET);

        const response = NextResponse.json({ ok: true }, { status: 201 });
        response.cookies.set('tilt_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (err) {
        console.error('[tilt/signup]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}