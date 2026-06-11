import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/services/auth.service";
import { TicketService } from "@/src/services/ticket.service";
import { toNextResponse } from "@/src/lib/api-response";
import { AdminLogService, extractIpFromRequest } from "@/src/services/admin-log.service";
import { z } from "zod";

const redeemSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const parsed = redeemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await TicketService.verifyAndRedeemTicket(parsed.data.token, auth.data.id);
  if (!result.success) return toNextResponse(result);

  await AdminLogService.logAction({
    adminId: auth.data.id,
    action: "redeem_ticket",
    description: `Ticket ${parsed.data.token.slice(0, 8)}… redeemed`,
    entityType: "ticket",
    ipAddress: extractIpFromRequest(req),
  });

  return NextResponse.json(result.data);
}
