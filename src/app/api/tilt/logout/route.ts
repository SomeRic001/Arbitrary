// src/app/api/tilt/logout/route.ts
// Clears the tilt_token cookie, ending the tilt session.

import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('tilt_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,   // expire immediately
        path: '/',
    });
    return response;
}