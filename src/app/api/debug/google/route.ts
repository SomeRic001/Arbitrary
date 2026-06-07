import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { authOptions } from "@/src/auth";
import { requireUser } from "@/src/services/auth.service";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getServerSession(authOptions);
  const s = session as any;

  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, auth.data.id),
  });

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const cookieName = secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  const cookieVal = cookieStore.get(cookieName)?.value;

  let jwtDecoded: Record<string, unknown> | null = null;
  if (cookieVal) {
    try {
      jwtDecoded = await decode({ token: cookieVal, secret: process.env.NEXTAUTH_SECRET! });
    } catch { /* ignore decode errors */ }
  }

  const googleTokenFields = jwtDecoded
    ? {
        hasGoogleAccessToken: "googleAccessToken" in jwtDecoded && !!jwtDecoded.googleAccessToken,
        hasGoogleRefreshToken: "googleRefreshToken" in jwtDecoded && !!jwtDecoded.googleRefreshToken,
        hasGoogleTokenExpiry: "googleTokenExpiry" in jwtDecoded,
        googleTokenExpiry: jwtDecoded.googleTokenExpiry ?? null,
      }
    : null;

  return NextResponse.json({
    userId: auth.data.id,
    dbGoogleId: dbUser?.googleId ?? null,
    session: {
      hasSession: !!session,
      hasGoogleAccessToken: "googleAccessToken" in (s ?? {}),
      googleAccessTokenPresent: !!s?.googleAccessToken,
      googleAccessTokenLength: s?.googleAccessToken?.length ?? 0,
      hasGoogleRefreshToken: "googleRefreshToken" in (s ?? {}),
      googleRefreshTokenPresent: !!s?.googleRefreshToken,
      googleRefreshTokenLength: s?.googleRefreshToken?.length ?? 0,
      googleTokenExpiry: s?.googleTokenExpiry ?? null,
      isExpired: s?.googleTokenExpiry ? Date.now() > s.googleTokenExpiry * 1000 : null,
      sessionEmail: s?.user?.email ?? null,
    },
    jwtCookie: {
      cookieExists: !!cookieVal,
      cookieName,
      decoded: googleTokenFields,
    },
    now: Date.now(),
  });
}
