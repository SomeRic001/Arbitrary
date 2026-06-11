import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { db } from "@/src/db";
import { usersTable, adminActivityLogsTable, eventsTable } from "@/src/db/schema";
import { eq, sql, desc, and, gte, count } from "drizzle-orm";
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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "user"),
          gte(usersTable.createdAt, thirtyDaysAgo),
        ),
      );

    const [pointsResult] = await db
      .select({ total: sql<number>`coalesce(sum(${usersTable.points}), 0)` })
      .from(usersTable);

    const [eventsResult] = await db
      .select({ count: count() })
      .from(eventsTable);

    const recentActivity = await db
      .select({
        id: adminActivityLogsTable.id,
        action: adminActivityLogsTable.action,
        description: adminActivityLogsTable.description,
        entityType: adminActivityLogsTable.entityType,
        entityId: adminActivityLogsTable.entityId,
        createdAt: adminActivityLogsTable.createdAt,
      })
      .from(adminActivityLogsTable)
      .where(eq(adminActivityLogsTable.adminId, auth.data.id))
      .orderBy(desc(adminActivityLogsTable.createdAt))
      .limit(10);

    return NextResponse.json({
      user,
      stats: {
        activeUsers: Number(activeUsersResult?.count ?? 0),
        pointsDistributed: Number(pointsResult?.total ?? 0),
        eventsManaged: Number(eventsResult?.count ?? 0),
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

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: "Internal server error occurred while updating profile" }, { status: 500 });
  }
}
