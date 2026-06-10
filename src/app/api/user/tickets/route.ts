import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { TicketService } from "@/src/services/ticket.service";
import { toNextResponse } from "@/src/lib/api-response";

export async function GET() {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const result = await TicketService.getUserTickets(auth.data.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ tickets: result.data, serverTime: new Date().toISOString() });
}

import { z } from "zod";

const redeemTicketSchema = z.object({
  eventId: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  accessTypeId: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await req.json();
  const parsed = redeemTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await TicketService.redeemTicket(
    auth.data.id,
    parsed.data.eventId,
    parsed.data.accessTypeId,
    auth.data.email ?? undefined,
    auth.data.name ?? undefined,
  );
  if (!result.success) return toNextResponse(result);

  return NextResponse.json(result.data);
}
