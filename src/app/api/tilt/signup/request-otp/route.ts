// src/app/api/tilt/signup/request-otp/route.ts
//
// Step 1 of the OTP signup flow.
// Validates the form fields, generates a 6-digit OTP, stores a hashed copy
// alongside the hashed password in tilt_otp, and emails the plaintext code.
//
// Security notes:
//  - OTP is generated with crypto.getRandomValues (CSPRNG).
//  - Only the bcrypt hash is persisted — the plaintext OTP is discarded.
//  - Old rows for the same email are deleted before inserting a new one
//    (ensures only the latest OTP is valid).
//  - Resend cooldown: a new OTP can only be requested if the last one was
//    created more than 60 seconds ago.
//  - The email address is never revealed in error messages that could be
//    used for user-enumeration.

import { NextRequest, NextResponse } from 'next/server';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltUsersTable, tiltOtpTable } from '@/src/db/tilt-schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/src/lib/email';
import { tiltOtpHtml } from '@/src/lib/emails/tilt-otp';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // ── Basic validation ────────────────────────────────────────────────
        if (!name?.trim() || !email?.trim() || !password) {
            return NextResponse.json(
                { error: 'Name, email and password are required.' },
                { status: 400 },
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters.' },
                { status: 400 },
            );
        }

        const normalEmail = email.toLowerCase().trim();

        // ── Reject if email already has a verified Tilt account ─────────────
        const [existing] = await tiltDb
            .select({ id: tiltUsersTable.id })
            .from(tiltUsersTable)
            .where(eq(tiltUsersTable.email, normalEmail));

        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists.' },
                { status: 409 },
            );
        }

        // ── Resend cooldown: block if a fresh OTP was issued < 60 s ago ─────
        const cooldownCutoff = new Date(Date.now() - 60_000); // 60 seconds ago
        const [recentOtp] = await tiltDb
            .select({ createdAt: tiltOtpTable.createdAt })
            .from(tiltOtpTable)
            .where(
                and(
                    eq(tiltOtpTable.email, normalEmail),
                    gt(tiltOtpTable.createdAt, cooldownCutoff),
                ),
            );

        if (recentOtp) {
            const secondsLeft = Math.ceil(
                (recentOtp.createdAt.getTime() + 60_000 - Date.now()) / 1000,
            );
            return NextResponse.json(
                { error: `Please wait ${secondsLeft}s before requesting a new code.` },
                { status: 429 },
            );
        }

        // ── Generate 6-digit OTP via CSPRNG ────────────────────────────────
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const otp = String(array[0] % 1_000_000).padStart(6, '0');

        // ── Hash the OTP and the password before storing ────────────────────
        const [otpHash, passwordHash] = await Promise.all([
            bcrypt.hash(otp, 10),
            bcrypt.hash(password, 12),
        ]);

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // +10 minutes

        // ── Delete any previous OTPs for this email, then insert fresh one ──
        await tiltDb.delete(tiltOtpTable).where(eq(tiltOtpTable.email, normalEmail));

        await tiltDb.insert(tiltOtpTable).values({
            email: normalEmail,
            otpHash,
            pendingName: name.trim(),
            pendingPasswordHash: passwordHash,
            expiresAt,
        });

        // ── Send OTP email ──────────────────────────────────────────────────
        const sent = await sendEmail({
            to: normalEmail,
            subject: 'Your Tilt verification code',
            html: tiltOtpHtml(name.trim(), otp),
        });

        if (!sent) {
            // Clean up the row so the user can retry immediately
            await tiltDb.delete(tiltOtpTable).where(eq(tiltOtpTable.email, normalEmail));
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 },
            );
        }

        // ── Never return the OTP ────────────────────────────────────────────
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error('[tilt/signup/request-otp]', err);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 },
        );
    }
}