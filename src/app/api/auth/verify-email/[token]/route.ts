import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq, and, isNotNull, like } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const lookupKey = crypto.createHash("sha256").update(token).digest("hex").slice(0, 16);
  const candidates = await db
    .select()
    .from(usersTable)
    .where(
      and(
        isNotNull(usersTable.verificationToken),
        like(usersTable.verificationToken, `${lookupKey}:%`),
      ),
    );

  const now = new Date();
  let matchedUser: typeof usersTable.$inferSelect | null = null;

  for (const user of candidates) {
    const bcryptHash = user.verificationToken!.split(":").slice(1).join(":") || user.verificationToken!;
    const isValid = await bcrypt.compare(token, bcryptHash);
    if (isValid) {
      if (user.isVerified) {
        return NextResponse.json({ valid: true, alreadyVerified: true });
      }
      if (now > user.verificationTokenExpiresAt!) {
        return NextResponse.json(
          { valid: false, error: "Verification link has expired. Request a new one." },
          { status: 400 },
        );
      }
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    return NextResponse.json(
      { valid: false, error: "Invalid verification link" },
      { status: 400 },
    );
  }

  await db
    .update(usersTable)
    .set({ isVerified: true })
    .where(eq(usersTable.id, matchedUser.id));

  return NextResponse.json({ valid: true });
}
