"use client";

import type { Event } from "@/src/types/db";
import type { GlobalActivityItem } from "../page";

interface OverviewTabProps {
  stats: { label: string; value: string; growth: string }[];
  events: Event[];
  globalActivity: GlobalActivityItem[];
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

const OverviewTab = ({
  stats,
  events,
  globalActivity,
  onViewAllEvents,
}: OverviewTabProps) => (
  <div className="animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 group"
        >
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
            {stat.label}
          </p>
          <h3 className="text-2xl md:text-4xl font-black mb-2 group-hover:text-[#FACC15] transition-colors">
            {stat.value}
          </h3>
          <p className="text-xs font-bold text-green-500 uppercase tracking-tight">
            {stat.growth}
          </p>
        </div>
      ))}
    </div>

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

      <div className="bg-black text-white p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8">
          <div className="w-20 h-20 bg-[#FACC15] rounded-full blur-[60px] opacity-20" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-[#FACC15]">
          System Status
        </h3>
        <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
          All systems are operational. The database is synchronized and the API
          is serving requests at optimal speeds.
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Database Connection: Stable
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <div className="w-2 h-2 bg-zinc-500 rounded-full" />
            Last Backup: 2h ago
          </div>
        </div>
      </div>
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
          {globalActivity.map((entry) => (
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
