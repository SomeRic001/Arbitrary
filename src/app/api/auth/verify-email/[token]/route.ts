import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const candidates = await db
    .select()
    .from(usersTable)
    .where(isNotNull(usersTable.verificationToken));

  const now = new Date();
  let matchedUser: typeof usersTable.$inferSelect | null = null;

  for (const user of candidates) {
    const isValid = await bcrypt.compare(token, user.verificationToken!);
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
