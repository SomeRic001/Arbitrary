// src/app/api/tilt/register/route.ts
//
// Handles Tilt event registration (guest-only, accessed via QR code).
//
// Validation (Zod):
//   - All fields required and trimmed
//   - Email must be a valid email address
//   - Phone must be a valid Nepali number: starts with 98/97 (mobile)
//     or 01 (Kathmandu landline), exactly 10 digits
//   - Same email or phone cannot be registered twice

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tiltDb } from '@/src/db/tilt-db';
import { tiltRegistrationsTable } from '@/src/db/tilt-schema';
import { eq, or } from 'drizzle-orm';

// ── Nepali phone validation ──────────────────────────────────────────────────
// Accepts exactly 10 digits (after stripping optional +977 / 977 country code).
// Valid prefixes: 98x / 97x (mobile), 01 (Kathmandu landline), 0[2-9]x (provincial)
const nepaliPhoneSchema = z
    .string({ error: 'Phone number is required or must be a string.' })
    .transform((val) => {
        const cleaned = val.trim().replace(/\s+/g, '');
        return cleaned.replace(/^\+?977/, '');
    })
    .refine(
        (val) => val.length === 10 && /^(98|97|01|0[2-9])\d{8}$/.test(val),
        {
            message: 'Phone number must be a valid Nepali number (e.g. 98XXXXXXXX or 01XXXXXXXX), exactly 10 digits.',
        },
    );

const RegistrationSchema = z.object({
    name: z.string().trim().min(1, 'Name is required.'),
    email: z
        .string()
        .trim()
        .min(1, 'Email is required.')
        .email('Please enter a valid email address.')
        .transform((val) => val.toLowerCase()),
    phone: nepaliPhoneSchema,
    address: z.string().trim().min(1, 'Address is required.'),
});

export async function POST(req: NextRequest) {
    try {
        // ── Parse & validate body with Zod ────────────────────────────────
        const body = await req.json();
        const parsed = RegistrationSchema.safeParse(body);

        if (!parsed.success) {
            const firstError = parsed.error?.issues?.[0]?.message ?? 'Invalid input.';
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { name, email, phone, address } = parsed.data;

        // ── Duplicate check (email OR phone) in a single query ─────────────
        const dupes = await tiltDb
            .select({ id: tiltRegistrationsTable.id, email: tiltRegistrationsTable.email, phone: tiltRegistrationsTable.phone })
            .from(tiltRegistrationsTable)
            .where(
                or(
                    eq(tiltRegistrationsTable.email, email),
                    eq(tiltRegistrationsTable.phone, phone),
                )
            );

        if (dupes.length > 0) {
            const emailTaken = dupes.some((r) => r.email === email);
            const phoneTaken = dupes.some((r) => r.phone === phone);

            if (emailTaken && phoneTaken) {
                return NextResponse.json(
                    { error: 'This email address and phone number are already registered.' },
                    { status: 409 },
                );
            }
            if (emailTaken) {
                return NextResponse.json(
                    { error: 'This email address is already registered.' },
                    { status: 409 },
                );
            }
            return NextResponse.json(
                { error: 'This phone number is already registered.' },
                { status: 409 },
            );
        }

        // ── Insert registration ────────────────────────────────────────────
        await tiltDb.insert(tiltRegistrationsTable).values({
            name,
            email,
            phone,
            address,
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error('[tilt/register]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}