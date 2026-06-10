import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { TicketService } from "@/src/services/ticket.service";
import { toNextResponse } from "@/src/lib/api-response";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get("token");
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const result = await TicketService.lookupTicket(token);
  if (!result.success) return toNextResponse(result);

  const ticket = result.data;

  if (eventId && ticket.event && String(ticket.event.id) !== eventId) {
    return NextResponse.json({ error: "This ticket belongs to a different event" }, { status: 403 });
  }

  return NextResponse.json({ ticket });
}
