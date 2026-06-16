// src/app/api/tilde/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { tildeDb } from '@/src/db/tilde-db';
import { tildeUsersTable } from '@/src/db/tilde-schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const TILDE_JWT_SECRET = new TextEncoder().encode(
    process.env.TILDE_JWT_SECRET ?? 'tilde-fallback-secret-change-in-production'
);

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email?.trim() || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        // ── Find user ──────────────────────────────────────────────────────
        const [user] = await tildeDb
            .select()
            .from(tildeUsersTable)
            .where(eq(tildeUsersTable.email, email.toLowerCase().trim()));

        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // ── Verify password ────────────────────────────────────────────────
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // ── Issue JWT ──────────────────────────────────────────────────────
        const token = await new SignJWT({ id: user.id, email: user.email, name: user.name })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(TILDE_JWT_SECRET);

        const response = NextResponse.json({ ok: true }, { status: 200 });
        response.cookies.set('tilde_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (err) {
        console.error('[tilde/login]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}