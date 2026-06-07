import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { dealsTable, dealCodesTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { SecurityService } from "@/src/services/security.service";
import { requireUser } from "@/src/services/auth.service";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const normalized = code.trim().toUpperCase();

  const rows = await db
    .select({
      encryptedCode: dealCodesTable.code,
      dealId: dealCodesTable.dealId,
      dealTitle: dealsTable.title,
      discountType: dealsTable.discountType,
      discountValue: dealsTable.discountValue,
      discountMaxAmount: dealsTable.discountMaxAmount,
    })
    .from(dealCodesTable)
    .innerJoin(dealsTable, eq(dealCodesTable.dealId, dealsTable.id))
    .where(
      and(
        eq(dealCodesTable.isRedeemed, false),
        eq(dealCodesTable.claimedBy, auth.data.id),
        eq(dealsTable.isActive, true),
      ),
    );

  for (const row of rows) {
    const decrypted = SecurityService.decrypt(row.encryptedCode);
    if (decrypted && decrypted.trim().toUpperCase() === normalized) {
      return NextResponse.json({
        valid: true,
        dealId: row.dealId,
        dealTitle: row.dealTitle,
        discountType: row.discountType,
        discountValue: row.discountValue,
        discountMaxAmount: row.discountMaxAmount,
        code: decrypted.trim(),
      });
    }
  }

  return NextResponse.json({ valid: false, error: "Invalid or expired discount code" }, { status: 404 });
}
