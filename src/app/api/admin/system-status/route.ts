import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { db } from "@/src/db";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readAppVersion(): string | null {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf-8");
    return JSON.parse(raw)?.version ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const dbCheckStart = Date.now();
  let dbConnected = true;
  let dbLatencyMs: number | null = null;
  try {
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbCheckStart;
  } catch {
    dbConnected = false;
  }

  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.GIT_COMMIT_SHA?.slice(0, 7) ??
    null;
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null;

  return NextResponse.json({
    db: {
      connected: dbConnected,
      latencyMs: dbLatencyMs,
    },
    api: {
      healthy: true,
      checkedAt: new Date().toISOString(),
    },
    deployment: {
      version: readAppVersion(),
      commit,
      environment,
    },
    lastBackupAt: null,
  });
}
