import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/pre-oauth
 *
 * Called by the signup page immediately before redirecting to an OAuth
 * provider (Google, Facebook). Stores the referral code in a short-lived
 * httpOnly cookie so it survives the provider redirect and can be read
 * server-side inside the NextAuth signIn callback.
 *
 * Why a cookie instead of callbackUrl or sessionStorage?
 * - callbackUrl is user-visible and editable in the URL bar; embedding
 *   business logic there lets anyone inject arbitrary ref codes into
 *   any login flow, not just fresh signups.
 * - sessionStorage is tab-local and browser-local — it dies on cross-
 *   browser links (the exact scenario that broke referrals).
 * - An httpOnly cookie is invisible to JS, scoped to same-origin, and
 *   travels automatically with the OAuth redirect round-trip.
 */
export async function POST(req: NextRequest) {
    const { refCode } = await req.json();

    const res = NextResponse.json({ ok: true });

    if (refCode && typeof refCode === "string") {
        res.cookies.set("pending_ref_code", refCode.trim().toUpperCase(), {
            httpOnly: true,        // not accessible to JS — XSS-safe
            sameSite: "lax",       // travels on top-level OAuth redirect
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 10,       // 10 minutes — enough for OAuth round-trip
        });
    }

    return res;
}