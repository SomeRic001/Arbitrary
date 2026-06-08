import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/src/lib/rate-limit";
import { sendEmail } from "@/src/lib/email";
import { verifyEmailHtml } from "@/src/lib/emails/verify-email";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const { email } = parsed.data;

  const ip = getClientIp(req);
  const rl = await rateLimit(`verify-email:ip:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (!user || user.isVerified || !user.password) {
    return NextResponse.json({ success: true });
  }

  const rawToken = crypto.randomUUID();
  const tokenHash = await bcrypt.hash(rawToken, 10);

  await db
    .update(usersTable)
    .set({
      verificationToken: tokenHash,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .where(eq(usersTable.id, user.id));

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyLink = `${baseUrl}/verify-email/${rawToken}`;

  await sendEmail({
    to: email,
    subject: "Verify your Arbitary email",
    html: verifyEmailHtml(user.name || "there", verifyLink),
  });

  return NextResponse.json({ success: true });
}
