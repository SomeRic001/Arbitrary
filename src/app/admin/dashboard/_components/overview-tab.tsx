"use client";

import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Wifi,
  WifiOff,
  Server,
  GitCommit,
  CalendarPlus,
  ClipboardCheck,
  Database,
  ShieldAlert,
  // Ticket, // TEMPORARILY HIDDEN (client request) — paired with the
  // commented-out "Scan Tickets" quick action below; restore together.
  Users,
} from "lucide-react";
import type { Event } from "@/src/types/db";
import type { GlobalActivityItem, SystemStatus } from "../page";
import ActivityFeed, { type ActivityFeedEntry } from "./activity-feed";

export interface Trend {
  direction: "up" | "down" | "flat";
  changePct: number | null;
}

interface StatCardData {
  label: string;
  value: string;
  growth: string;
  trend?: Trend | null;
}

interface OverviewTabProps {
  stats: StatCardData[];
  events: Event[];
  globalActivity: GlobalActivityItem[];
  criticalAlerts: GlobalActivityItem[];
  systemStatus: SystemStatus | null;
  systemStatusError: boolean;
  onViewAllEvents: () => void;
}

const ENTITY_LABELS: Record<string, string> = {
  event: "Manage Events",
  task: "Manage Tasks",
  ticket: "Manage Tickets",
  user: "Manage Users",
  submission: "Manage Submissions",
  record: "Manage Records",
};

const QUICK_ACTIONS = [
  {
    label: "Create Event",
    description: "Add a new event or tour stop",
    href: "/admin/dashboard/events",
    icon: CalendarPlus,
  },
  {
    label: "Manage Users",
    description: "View and search all users",
    href: "/admin/dashboard/users",
    icon: Users,
  },
  {
    label: "Review Submissions",
    description: "Approve or reject entries",
    href: "/admin/dashboard/submissions",
    icon: ClipboardCheck,
  },
  {
    label: "Audit Records",
    description: "Manage the records catalog",
    href: "/admin/dashboard/records",
    icon: Database,
  },
  {
    label: "Fraud Review",
    description: "Investigate flagged accounts",
    href: "/admin/dashboard/fraud",
    icon: ShieldAlert,
  },
  // TEMPORARILY HIDDEN (client request): Scan Tickets quick action.
  // Do not delete — route/API remain intact at /admin/tickets/scanner;
  // restore by uncommenting this block.
  // {
  //   label: "Scan Tickets",
  //   description: "Open the ticket scanner",
  //   href: "/admin/tickets/scanner",
  //   icon: Ticket,
  // },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.substring(0, 2).toUpperCase();
  return email.substring(0, 2).toUpperCase();
}

function globalActivityToFeedEntry(
  item: GlobalActivityItem,
): ActivityFeedEntry {
  return {
    id: item.id,
    description: item.description,
    logLevel: item.logLevel,
    entityType: item.entityType,
    entityId: item.entityId,
    createdAt: item.createdAt,
    admin: item.admin,
  };
}

function TrendBadge({ trend }: { trend?: Trend | null }) {
  if (!trend) return null;

  if (trend.changePct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tight text-green-500">
        <ArrowUp className="w-3 h-3" />
        New
      </span>
    );
  }

  const Icon =
    trend.direction === "up"
      ? ArrowUp
      : trend.direction === "down"
        ? ArrowDown
        : Minus;
  const color =
    trend.direction === "up"
      ? "text-green-500"
      : trend.direction === "down"
        ? "text-red-500"
        : "text-zinc-400";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${color}`}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(trend.changePct)}%
    </span>
  );
}

const OverviewTab = ({
  stats,
  events,
  globalActivity,
  criticalAlerts,
  systemStatus,
  systemStatusError,
  onViewAllEvents,
}: OverviewTabProps) => (
  <div className="animate-fade-in">
    {/* Stat Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 group"
        >
          <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              {stat.label}
            </p>
            <TrendBadge trend={stat.trend} />
          </div>
          <h3 className="text-2xl md:text-4xl font-black mb-2 group-hover:text-[#FACC15] transition-colors">
            {stat.value}
          </h3>
          <p className="text-xs font-bold text-green-500 uppercase tracking-tight">
            {stat.growth}
          </p>
        </div>
      ))}
    </div>

    {/* Quick Actions */}
    <div className="mb-12">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
        Quick Actions
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col gap-3 p-4 md:p-5 rounded-[1.5rem] bg-white border border-black/5 shadow-sm hover:shadow-lg hover:border-[#FACC15]/40 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center group-hover:bg-[#FACC15] transition-colors shrink-0">
              <action.icon className="w-4 h-4 text-[#FACC15] group-hover:text-black transition-colors" />
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-tight">
                {action.label}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5 leading-snug">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>

    {/* Recent Events + System Status */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
            Recent Events
          </h3>
          <button
            onClick={onViewAllEvents}
            className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#FACC15] bg-black px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-[#FACC15] hover:text-black transition-all"
          >
            View All
          </button>
        </div>
        <div className="space-y-4 md:space-y-6">
          {events.slice(0, 3).map((event: Event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-zinc-50 transition-all border border-transparent hover:border-black/5 group"
            >
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-100 group-hover:bg-[#FACC15]/20 transition-colors shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-xs md:text-sm uppercase tracking-tight truncate">
                    {event.title}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase">
                    {event.eventDate instanceof Date
                      ? event.eventDate.toLocaleDateString()
                      : String(event.eventDate)}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1 rounded-full ${event.status === "Success" ? "text-green-500 bg-green-50" : "text-[#FACC15] bg-[#FACC15]/10"}`}
              >
                {event.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-black text-white p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8">
          <div className="w-20 h-20 bg-[#FACC15] rounded-full blur-[60px] opacity-20" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-[#FACC15]">
          System Status
        </h3>

        {systemStatusError ? (
          <p className="text-zinc-500 text-sm font-medium leading-relaxed">
            Couldn&apos;t reach the status endpoint. This page may be showing
            stale data.
          </p>
        ) : !systemStatus ? (
          <p className="text-zinc-500 text-sm font-medium leading-relaxed">
            Checking system status…
          </p>
        ) : (
          <>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
              {systemStatus.db.connected
                ? "Database is reachable and the API is serving requests."
                : "The database connection check failed — investigate immediately."}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${systemStatus.db.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                Database: {systemStatus.db.connected ? "Stable" : "Unreachable"}
                {systemStatus.db.connected &&
                  systemStatus.db.latencyMs != null && (
                    <span className="text-zinc-500 normal-case font-medium tracking-normal">
                      ({systemStatus.db.latencyMs}ms)
                    </span>
                  )}
              </div>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                {systemStatus.api.healthy ? (
                  <Wifi className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                API: {systemStatus.api.healthy ? "Healthy" : "Degraded"}
              </div>
              {systemStatus.deployment.version && (
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <Server className="w-3.5 h-3.5 shrink-0" />
                  Version v{systemStatus.deployment.version}
                  {systemStatus.deployment.environment &&
                    ` · ${systemStatus.deployment.environment}`}
                </div>
              )}
              {systemStatus.deployment.commit && (
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <GitCommit className="w-3.5 h-3.5 shrink-0" />
                  {systemStatus.deployment.commit}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
                <div className="w-2 h-2 bg-zinc-700 rounded-full shrink-0" />
                Last Backup:{" "}
                {systemStatus.lastBackupAt
                  ? new Date(systemStatus.lastBackupAt).toLocaleString()
                  : "Not available"}
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Critical Alerts */}
    <div className="mb-8">
      <ActivityFeed
        entries={criticalAlerts.map(globalActivityToFeedEntry)}
        title="Critical Alerts"
        emptyMessage="No critical alerts. All clear."
        lockedLevel="CRITICAL"
        showAdminAttribution
        showLevelFilter={false}
        variant="alert"
        maxHeightClass="max-h-[320px]"
      />
    </div>

    {/* Global Activity Feed */}
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
      <div className="mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
          Global Activity
        </h3>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">
          All admin actions across the system
        </p>
      </div>

      {globalActivity.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-medium text-zinc-400">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {globalActivity.slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl hover:bg-zinc-50 transition-all"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FACC15] flex items-center justify-center shrink-0">
                <span className="text-black font-black text-xs md:text-sm">
                  {getInitials(entry.admin.name, entry.admin.email)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-bold text-zinc-800 leading-tight">
                  <span className="text-zinc-500 font-semibold">
                    {entry.admin.name || entry.admin.email.split("@")[0]}
                  </span>{" "}
                  {entry.description}
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                  {ENTITY_LABELS[entry.entityType] ?? entry.entityType}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default OverviewTab;
