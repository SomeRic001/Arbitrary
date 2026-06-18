import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { tiltDb } from "@/src/db/tilt-db";
import { qrTokensTable } from "@/src/db/tilt-schema";

const TILT_JWT_SECRET = new TextEncoder().encode(
  process.env.TILT_JWT_SECRET ?? "tilt-fallback-secret-change-in-production",
);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("tilt_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: { id: number; role: string };
    try {
      const { payload: p } = await jwtVerify(token, TILT_JWT_SECRET);
      payload = p as typeof payload;
    } catch {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    if (payload.role !== "outlet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const qrToken = req.nextUrl.searchParams.get("token")?.trim();
    if (!qrToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const [row] = await tiltDb
      .select({
        usedAt: qrTokensTable.usedAt,
        expiresAt: qrTokensTable.expiresAt,
      })
      .from(qrTokensTable)
      .where(eq(qrTokensTable.token, qrToken));

    if (!row) {
      return NextResponse.json({ status: "expired" }, { status: 200 });
    }

    if (row.usedAt) {
      return NextResponse.json({ status: "used" }, { status: 200 });
    }

    if (row.expiresAt < new Date()) {
      return NextResponse.json({ status: "expired" }, { status: 200 });
    }

    return NextResponse.json({ status: "active" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
