// src/app/api/tilde/logout/route.ts
// Clears the tilde_token cookie, ending the Tilde session.

import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('tilde_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,   // expire immediately
        path: '/',
    });
    return response;
}