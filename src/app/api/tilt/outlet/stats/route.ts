import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { tiltDb } from "@/src/db/tilt-db";
import { qrTokensTable, lotterySessionsTable } from "@/src/db/tilt-schema";

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

    const outletId = String(payload.id);

    const [scanResult] = await tiltDb
      .select({ count: count() })
      .from(qrTokensTable)
      .where(
        and(
          eq(qrTokensTable.outletId, outletId),
          isNotNull(qrTokensTable.usedAt),
        ),
      );

    const [submissionResult] = await tiltDb
      .select({ count: count() })
      .from(qrTokensTable)
      .innerJoin(
        lotterySessionsTable,
        eq(lotterySessionsTable.tokenId, qrTokensTable.id),
      )
      .where(
        and(
          eq(qrTokensTable.outletId, outletId),
          isNotNull(lotterySessionsTable.submittedAt),
        ),
      );

    return NextResponse.json(
      {
        scans: Number(scanResult?.count ?? 0),
        submissions: Number(submissionResult?.count ?? 0),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
