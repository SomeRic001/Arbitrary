import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/src/db";
import { usersTable, passwordResetTokensTable } from "@/src/db/schema";
import { eq, and, isNull, like } from "drizzle-orm";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

async function findToken(rawToken: string) {
  const lookupKey = crypto.createHash("sha256").update(rawToken).digest("hex").slice(0, 16);
  const candidates = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        isNull(passwordResetTokensTable.usedAt),
        like(passwordResetTokensTable.tokenHash, `${lookupKey}:%`),
      ),
    );

  const now = new Date();
  for (const t of candidates) {
    const bcryptHash = t.tokenHash.split(":").slice(1).join(":") || t.tokenHash;
    const isValid = await bcrypt.compare(rawToken, bcryptHash);
    if (isValid) {
      if (now > t.expiresAt) {
        await db
          .update(passwordResetTokensTable)
          .set({ usedAt: now })
          .where(eq(passwordResetTokensTable.id, t.id));
        return { token: null, expired: true };
      }
      return { token: t, expired: false };
    }
  }
  return { token: null, expired: false };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await findToken(token);
  if (result.expired) {
    return NextResponse.json({ valid: false, error: "Token has expired" });
  }
  if (!result.token) {
    return NextResponse.json({ valid: false, error: "Invalid or expired reset link" });
  }
  return NextResponse.json({ valid: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const result = await findToken(token);
  if (result.expired) {
    return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
  }
  if (!result.token) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ password: passwordHash })
      .where(eq(usersTable.email, result.token!.email));

    await tx
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, result.token!.id));
  });

  return NextResponse.json({ success: true });
}
