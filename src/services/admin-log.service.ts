import { db } from "@/src/db";
import { adminActivityLogsTable } from "@/src/db/schema";
import { and, gte, count, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export interface AdminLogParams {
  adminId: number;
  action: string;
  description: string;
  entityType: string;
  entityId?: number | null;
  metadata?: Record<string, unknown> | null;
  logLevel?: "INFO" | "WARNING" | "CRITICAL";
  ipAddress?: string | null;
}

const DESTRUCTIVE_PREFIXES = ["delete_", "remove_", "ban_", "suspend_"];
const DESTRUCTIVE_THRESHOLD = 10;
const ANOMALY_WINDOW_MS = 5 * 60 * 1000;

function isDestructive(action: string): boolean {
  return DESTRUCTIVE_PREFIXES.some((p) => action.toLowerCase().startsWith(p));
}

export function extractIpFromRequest(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

async function detectAnomaly(
  adminId: number,
  action: string,
  entityType: string,
): Promise<{ escalated: boolean; warning?: string }> {
  if (!isDestructive(action)) return { escalated: false };

  const since = new Date(Date.now() - ANOMALY_WINDOW_MS);

  const [result] = await db
    .select({ count: count() })
    .from(adminActivityLogsTable)
    .where(
      and(
        eq(adminActivityLogsTable.adminId, adminId),
        eq(adminActivityLogsTable.entityType, entityType),
        gte(adminActivityLogsTable.createdAt, since),
      ),
    );

  const recentCount = Number(result?.count ?? 0);

  if (recentCount > DESTRUCTIVE_THRESHOLD) {
    return {
      escalated: true,
      warning: `Anomaly: ${recentCount} destructive actions on ${entityType} in the last 5 minutes.`,
    };
  }

  return { escalated: false };
}

export const AdminLogService = {
  async logAction(params: AdminLogParams) {
    const logLevel = params.logLevel ?? "INFO";
    let finalDescription = params.description;
    let finalLogLevel = logLevel;

    if (logLevel !== "CRITICAL") {
      const anomaly = await detectAnomaly(params.adminId, params.action, params.entityType);
      if (anomaly.escalated) {
        finalDescription = `${params.description} — ${anomaly.warning}`;
        finalLogLevel = "CRITICAL";
      }
    }

    const [inserted] = await db
      .insert(adminActivityLogsTable)
      .values({
        adminId: params.adminId,
        action: params.action,
        description: finalDescription,
        logLevel: finalLogLevel,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? null,
        ipAddress: params.ipAddress ?? null,
      })
      .returning();

    return inserted;
  },
};
