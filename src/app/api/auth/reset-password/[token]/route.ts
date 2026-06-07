import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/src/db";
import { usersTable, passwordResetTokensTable } from "@/src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const allTokens = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        isNull(passwordResetTokensTable.usedAt),
      ),
    );

  const now = new Date();
  let validToken: typeof passwordResetTokensTable.$inferSelect | null = null;

  for (const t of allTokens) {
    const isValid = await bcrypt.compare(token, t.tokenHash);
    if (isValid) {
      if (now > t.expiresAt) {
        await db
          .update(passwordResetTokensTable)
          .set({ usedAt: now })
          .where(eq(passwordResetTokensTable.id, t.id));
        return NextResponse.json({ valid: false, error: "Token has expired" });
      }
      validToken = t;
      break;
    }
  }

  if (!validToken) {
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

  const allTokens = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        isNull(passwordResetTokensTable.usedAt),
      ),
    );

  const now = new Date();
  let matchedToken: typeof passwordResetTokensTable.$inferSelect | null = null;

  for (const t of allTokens) {
    const isValid = await bcrypt.compare(token, t.tokenHash);
    if (isValid) {
      if (now > t.expiresAt) {
        await db
          .update(passwordResetTokensTable)
          .set({ usedAt: now })
          .where(eq(passwordResetTokensTable.id, t.id));
        return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
      }
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ password: passwordHash })
      .where(eq(usersTable.email, matchedToken!.email));

    await tx
      .update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(eq(passwordResetTokensTable.id, matchedToken!.id));
  });

  return NextResponse.json({ success: true });
}
