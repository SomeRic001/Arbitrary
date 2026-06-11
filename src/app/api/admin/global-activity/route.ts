import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { db } from "@/src/db";
import { adminActivityLogsTable, usersTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
    .orderBy(desc(adminActivityLogsTable.createdAt))
    .limit(10);

  return NextResponse.json({ logs });
}
