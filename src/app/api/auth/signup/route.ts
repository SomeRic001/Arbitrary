import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserService } from "@/src/services/user.service";
import { rateLimit, getClientIp } from "@/src/lib/rate-limit";
import { sendEmail } from "@/src/lib/email";
import { verifyEmailHtml } from "@/src/lib/emails/verify-email";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password too long"),
  referralCode: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp({ headers: req.headers });
    const rl = await rateLimit(`signup:ip:${ip}`, 5, 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many signups from this network. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rawToken = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const result = await UserService.signup(parsed.data, {
      verificationToken: tokenHash,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyLink = `${baseUrl}/verify-email/${rawToken}`;

    await sendEmail({
      to: parsed.data.email,
      subject: "Verify your Arbitrary email",
      html: verifyEmailHtml(`${parsed.data.firstName} ${parsed.data.lastName}`, verifyLink),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
