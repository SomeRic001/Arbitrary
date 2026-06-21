import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { db } from "@/src/db";
import { adminActivityLogsTable, usersTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";

const VALID_LEVELS = new Set(["INFO", "WARNING", "CRITICAL"]);
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const levelParam = req.nextUrl.searchParams.get("level");
  const level = levelParam && VALID_LEVELS.has(levelParam) ? levelParam : null;

  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : 10;

  const logs = await db
    .select({
      id: adminActivityLogsTable.id,
      action: adminActivityLogsTable.action,
      description: adminActivityLogsTable.description,
      logLevel: adminActivityLogsTable.logLevel,
      entityType: adminActivityLogsTable.entityType,
      entityId: adminActivityLogsTable.entityId,
      createdAt: adminActivityLogsTable.createdAt,
      admin: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      },
    })
    .from(adminActivityLogsTable)
    .innerJoin(usersTable, eq(adminActivityLogsTable.adminId, usersTable.id))
    .where(level ? eq(adminActivityLogsTable.logLevel, level) : undefined)
    .orderBy(desc(adminActivityLogsTable.createdAt))
    .limit(limit);

  return NextResponse.json({ logs });
}
