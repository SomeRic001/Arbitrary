import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/src/services/auth.service";
import { TicketService } from "@/src/services/ticket.service";
import { toNextResponse } from "@/src/lib/api-response";
import z from "zod";

const redeemBodySchema = z.object({
  eventId: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
  accessTypeId: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
  quantity: z.number().int().min(1).max(10).optional().default(1),
  dealCode: z.string().optional(),
  dealId: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const parsed = redeemBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { eventId, accessTypeId, quantity, dealCode, dealId } = parsed.data;

  const result = await TicketService.redeemTicket(
    auth.data.id,
    eventId,
    accessTypeId,
    auth.data.email ?? undefined,
    auth.data.name ?? undefined,
    quantity,
    dealCode,
    dealId ? Number(dealId) : undefined,
  );
  if (!result.success) return toNextResponse(result);

  return NextResponse.json(result.data);
}
