// src/app/api/tilt/signup/verify-otp/route.ts
//
// Step 2 of the OTP signup flow.
// Verifies the submitted OTP, creates the tilt_users row, sets the JWT
// cookie, and deletes the consumed OTP row.
//
// Security notes:
//  - OTP is compared with bcrypt.compare (timing-safe).
//  - Expiry is checked independently of hash comparison.
//  - OTP row is deleted immediately on success (single-use).
//  - A duplicate-email check guards against a race condition where two
//    verify requests arrive simultaneously for the same email.
//  - On failure we intentionally do NOT delete the OTP — the user can
//    correct a typo and retry within the 10-minute window.

import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltUsersTable, tiltOtpTable } from '@/src/db/tilt-schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const TILT_JWT_SECRET = new TextEncoder().encode(
    process.env.TILT_JWT_SECRET ?? 'tilt-fallback-secret-change-in-production',
);

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email?.trim() || !otp?.trim()) {
            return NextResponse.json(
                { error: 'Email and verification code are required.' },
                { status: 400 },
            );
        }

        const normalEmail = email.toLowerCase().trim();

        // ── Look up the pending OTP row ─────────────────────────────────────
        const [pending] = await tiltDb
            .select()
            .from(tiltOtpTable)
            .where(eq(tiltOtpTable.email, normalEmail));

        if (!pending) {
            return NextResponse.json(
                { error: 'No verification code found for this email. Please request a new one.' },
                { status: 400 },
            );
        }

        // ── Check expiry ────────────────────────────────────────────────────
        if (new Date() > pending.expiresAt) {
            // Clean up expired row
            await tiltDb.delete(tiltOtpTable).where(eq(tiltOtpTable.id, pending.id));
            return NextResponse.json(
                { error: 'Verification code has expired. Please request a new one.' },
                { status: 400 },
            );
        }

        // ── Verify OTP (timing-safe bcrypt compare) ─────────────────────────
        const valid = await bcrypt.compare(otp.trim(), pending.otpHash);
        if (!valid) {
            return NextResponse.json(
                { error: 'Incorrect verification code. Please try again.' },
                { status: 400 },
            );
        }

        // ── Guard against race-condition duplicate email ─────────────────────
        const [alreadyExists] = await tiltDb
            .select({ id: tiltUsersTable.id })
            .from(tiltUsersTable)
            .where(eq(tiltUsersTable.email, normalEmail));

        if (alreadyExists) {
            await tiltDb.delete(tiltOtpTable).where(eq(tiltOtpTable.id, pending.id));
            return NextResponse.json(
                { error: 'An account with this email already exists.' },
                { status: 409 },
            );
        }

        // ── Create user with emailVerified = true ───────────────────────────
        const [user] = await tiltDb
            .insert(tiltUsersTable)
            .values({
                name: pending.pendingName,
                email: normalEmail,
                passwordHash: pending.pendingPasswordHash,
                emailVerified: true,
            })
            .returning({
                id: tiltUsersTable.id,
                name: tiltUsersTable.name,
                email: tiltUsersTable.email,
            });

        // ── Delete the consumed OTP row (single-use) ─────────────────────────
        await tiltDb.delete(tiltOtpTable).where(eq(tiltOtpTable.id, pending.id));

        // ── Issue JWT (same pattern as login/signup routes) ──────────────────
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
        console.error('[tilt/signup/verify-otp]', err);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 },
        );
    }
}