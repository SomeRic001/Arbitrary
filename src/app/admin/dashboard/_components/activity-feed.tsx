"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

export interface ActivityFeedEntry {
  id: number;
  description: string;
  logLevel: string;
  entityType: string;
  entityId: number | null;
  ipAddress?: string | null;
  createdAt: string | null;
  /** Present when the feed spans multiple admins (e.g. the global activity feed) */
  admin?: { id: number; name: string | null; email: string } | null;
}

/**
 * Admin pages that can be deep-linked to from an activity entry.
 * Only entity types with a real destination page are listed here.
 */
export const ACTIVITY_ENTITY_ROUTES: Record<string, string> = {
  event: "/admin/dashboard/events",
  record: "/admin/dashboard/records",
  task: "/admin/dashboard/tasks",
  submission: "/admin/dashboard/submissions",
};

const LOG_LEVELS = ["INFO", "WARNING", "CRITICAL"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const LOG_LEVEL_BORDER: Record<string, string> = {
  INFO: "border-l-green-500",
  WARNING: "border-l-yellow-500",
  CRITICAL: "border-l-red-500",
};

const LOG_LEVEL_DOT: Record<string, string> = {
  INFO: "bg-green-500",
  WARNING: "bg-yellow-500",
  CRITICAL: "bg-red-500",
};

const LOG_LEVEL_BADGE: Record<string, string> = {
  WARNING: "bg-yellow-100 text-yellow-600",
  CRITICAL: "bg-red-100 text-red-600",
};

function formatTimestamp(dateStr: string | null): string {
  return dateStr ? new Date(dateStr).toLocaleString() : "";
}

interface ActivityFeedProps {
  entries: ActivityFeedEntry[];
  title?: string;
  emptyMessage?: string;
  /** Show the ALL / INFO / WARNING / CRITICAL filter chips. Default: true */
  showLevelFilter?: boolean;
  /** Pre-filter to a single level without showing the chip row (e.g. a Critical Alerts widget). */
  lockedLevel?: LogLevel;
  /** Show which admin performed each action (for feeds spanning multiple admins). Default: false */
  showAdminAttribution?: boolean;
  maxHeightClass?: string;
  /** Visual accent for the card header. "alert" tints the header red. */
  variant?: "default" | "alert";
  className?: string;
}

export default function ActivityFeed({
  entries,
  title = "Recent Activity",
  emptyMessage = "No recent activity.",
  showLevelFilter = true,
  lockedLevel,
  showAdminAttribution = false,
  maxHeightClass = "max-h-[420px]",
  variant = "default",
  className = "",
}: ActivityFeedProps) {
  const [level, setLevel] = useState<"ALL" | LogLevel>("ALL");

  const effectiveLevel = lockedLevel ?? level;

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: entries.length, INFO: 0, WARNING: 0, CRITICAL: 0 };
    for (const e of entries) {
      if (c[e.logLevel] !== undefined) c[e.logLevel] += 1;
    }
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    if (effectiveLevel === "ALL") return entries;
    return entries.filter((e) => e.logLevel === effectiveLevel);
  }, [entries, effectiveLevel]);

  return (
    <div
      className={`bg-white rounded-[2.5rem] border border-black/5 shadow-sm p-6 md:p-8 ${className}`}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3
          className={`text-lg font-black uppercase tracking-tight ${
            variant === "alert" ? "text-red-600" : ""
          }`}
        >
          {title}
        </h3>
        {entries.length > 0 && (
          <span className="text-[10px] font-medium text-zinc-400">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {showLevelFilter && !lockedLevel && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(["ALL", ...LOG_LEVELS] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setLevel(opt)}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
                level === opt
                  ? "bg-black text-[#FACC15]"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {opt}
              <span className="ml-1 opacity-60">{counts[opt] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {entries.length === 0 ? emptyMessage : "No entries match this filter."}
        </p>
      ) : (
        <div className={`space-y-2 overflow-y-auto pr-1 ${maxHeightClass}`}>
          {filtered.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} showAdminAttribution={showAdminAttribution} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({
  entry,
  showAdminAttribution,
}: {
  entry: ActivityFeedEntry;
  showAdminAttribution: boolean;
}) {
  const borderColor = LOG_LEVEL_BORDER[entry.logLevel] ?? "border-l-zinc-300";
  const dotColor = LOG_LEVEL_DOT[entry.logLevel] ?? "bg-zinc-300";
  const route = ACTIVITY_ENTITY_ROUTES[entry.entityType];
  const href = route && entry.entityId != null ? `${route}?id=${entry.entityId}` : null;

  return (
    <div className={`flex items-start gap-3 pl-3 border-l-2 ${borderColor} py-2`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-zinc-700">
            {showAdminAttribution && entry.admin && (
              <span className="text-zinc-500 font-semibold">
                {entry.admin.name || entry.admin.email.split("@")[0]}{" "}
              </span>
            )}
            {entry.description}
          </p>
          {href && (
            <a
              href={href}
              className="shrink-0 mt-0.5 text-zinc-300 hover:text-zinc-600 transition-colors"
              title={`View ${entry.entityType}`}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-[10px] text-zinc-400 font-medium">{formatTimestamp(entry.createdAt)}</p>
          {entry.logLevel && entry.logLevel !== "INFO" && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                LOG_LEVEL_BADGE[entry.logLevel] ?? "bg-zinc-100 text-zinc-500"
              }`}
            >
              {entry.logLevel}
            </span>
          )}
          {entry.ipAddress && (
            <span className="text-[9px] text-zinc-300 font-mono">{entry.ipAddress}</span>
          )}
        </div>
      </div>
    </div>
  );
}
