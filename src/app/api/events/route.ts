import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { EventService } from "@/src/services/event.service";
import { AdminLogService, extractIpFromRequest } from "@/src/services/admin-log.service";
import { toNextResponse } from "@/src/lib/api-response";

export const revalidate = 0;

export async function GET() {
  try {
    const result = await EventService.getEvents();
    if (!result.success) return toNextResponse(result);

    return NextResponse.json({ success: true, events: result.data }, { status: 200 });
  } catch (err) {
    console.error("GET /api/events failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load events" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    const message = auth.status === 403
      ? "Only administrators can create or edit events."
      : "Please log in to continue.";
    return NextResponse.json({ error: message }, { status: auth.status });
  }

  const body = await req.json();
  const result = await EventService.createOrUpdateEvent(body);
  if (!result.success) return toNextResponse(result);

  if (result.data) {
    await AdminLogService.logAction({
      adminId: auth.data.id,
      action: body.id ? "update_event" : "create_event",
      description: body.id ? `Event "${body.title}" updated` : `Event "${body.title}" created`,
      entityType: "event",
      entityId: result.data.id,
      ipAddress: extractIpFromRequest(req),
    });
  }

  return NextResponse.json({ success: true, event: result.data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    const message = auth.status === 403
      ? "Only administrators can delete events."
      : "Please log in to continue.";
    return NextResponse.json({ error: message }, { status: auth.status });
  }

  const { id, title } = await req.json();
  const result = await EventService.deleteEvent(Number(id));
  if (!result.success) return toNextResponse(result);

  await AdminLogService.logAction({
    adminId: auth.data.id,
    action: "delete_event",
    description: title ? `Event "${title}" deleted` : `Event #${id} deleted`,
    entityType: "event",
    entityId: Number(id),
    ipAddress: extractIpFromRequest(req),
  });

  return NextResponse.json({ success: true, message: "Event deleted" }, { status: 200 });
}