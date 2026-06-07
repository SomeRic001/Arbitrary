import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/src/db";
import { usersTable, passwordResetTokensTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/src/lib/email";
import { rateLimit, getClientIp } from "@/src/lib/rate-limit";
import { resetPasswordHtml } from "@/src/lib/emails/reset-password";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const { email } = parsed.data;

  const ip = getClientIp(req);
  const rl = await rateLimit(`forgot-password:ip:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const emailRl = await rateLimit(`forgot-password:email:${email}`, 2, 60_000);
  if (!emailRl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${emailRl.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, password: usersTable.password })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (!user || !user.password) {
    return NextResponse.json({ success: true });
  }

  const rawToken = crypto.randomUUID();
  const tokenHash = await bcrypt.hash(rawToken, 10);

  await db.insert(passwordResetTokensTable).values({
    email: email.toLowerCase(),
    tokenHash,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password/${rawToken}`;

  const sent = await sendEmail({
    to: email,
    subject: "Reset your Arbitary password",
    html: resetPasswordHtml(user.name || "there", resetLink),
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
