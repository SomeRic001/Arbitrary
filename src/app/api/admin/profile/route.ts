import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { AdminLogService, extractIpFromRequest } from "@/src/services/admin-log.service";
import { db } from "@/src/db";
import { usersTable, adminActivityLogsTable } from "@/src/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().max(255).optional(),
  phone: z.string().max(255).optional(),
  location: z.string().optional(),
  bio: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phoneNumber: usersTable.phoneNumber,
        location: usersTable.location,
        bio: usersTable.bio,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        image: usersTable.image,
        lastLoginAt: usersTable.lastLoginAt,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, auth.data.id),
          eq(usersTable.role, "ADMIN"),
        ),
      );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin Impact: derived entirely from admin_activity_logs
    const [actionCounts, [criticalResult], recentActivity] = await Promise.all([
      db
        .select({
          entityType: adminActivityLogsTable.entityType,
          action: adminActivityLogsTable.action,
          count: count(),
        })
        .from(adminActivityLogsTable)
        .where(eq(adminActivityLogsTable.adminId, auth.data.id))
        .groupBy(adminActivityLogsTable.entityType, adminActivityLogsTable.action),
      db
        .select({ count: count() })
        .from(adminActivityLogsTable)
        .where(
          and(
            eq(adminActivityLogsTable.adminId, auth.data.id),
            eq(adminActivityLogsTable.logLevel, "CRITICAL"),
          ),
        ),
      db
        .select({
          id: adminActivityLogsTable.id,
          action: adminActivityLogsTable.action,
          description: adminActivityLogsTable.description,
          logLevel: adminActivityLogsTable.logLevel,
          entityType: adminActivityLogsTable.entityType,
          entityId: adminActivityLogsTable.entityId,
          metadata: adminActivityLogsTable.metadata,
          ipAddress: adminActivityLogsTable.ipAddress,
          createdAt: adminActivityLogsTable.createdAt,
        })
        .from(adminActivityLogsTable)
        .where(eq(adminActivityLogsTable.adminId, auth.data.id))
        .orderBy(desc(adminActivityLogsTable.createdAt))
        .limit(50),
    ]);

    const actionCount = (entityType: string, action: string) =>
      actionCounts.find((r) => r.entityType === entityType && r.action === action)?.count ?? 0;

    const totalActions = actionCounts.reduce((sum, r) => sum + Number(r.count), 0);
    const recordsModified =
      Number(actionCount("record", "create_record")) +
      Number(actionCount("record", "update_record")) +
      Number(actionCount("record", "delete_record"));

    return NextResponse.json({
      user,
      accountSecurity: {
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: null,
        twoFactorEnabled: null,
        passwordLastChangedAt: null,
      },
      adminImpact: {
        eventsCreated: Number(actionCount("event", "create_event")),
        eventsUpdated: Number(actionCount("event", "update_event")),
        eventsDeleted: Number(actionCount("event", "delete_event")),
        recordsModified,
        ticketsRedeemed: Number(actionCount("ticket", "redeem_ticket")),
        totalActions,
        criticalActions: Number(criticalResult?.count ?? 0),
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal server error occurred while fetching profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updates.phoneNumber = parsed.data.phone;
    if (parsed.data.location !== undefined) updates.location = parsed.data.location;
    if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(
        and(
          eq(usersTable.id, auth.data.id),
          eq(usersTable.role, "ADMIN"),
        ),
      )
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phoneNumber: usersTable.phoneNumber,
        location: usersTable.location,
        bio: usersTable.bio,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        image: usersTable.image,
      });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const changedFields = Object.keys(updates).join(", ");
    await AdminLogService.logAction({
      adminId: auth.data.id,
      action: "update_profile",
      description: `Profile updated: ${changedFields}`,
      entityType: "user",
      entityId: auth.data.id,
      metadata: { changedFields: Object.keys(updates) },
      ipAddress: extractIpFromRequest(req),
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: "Internal server error occurred while updating profile" }, { status: 500 });
  }
}
