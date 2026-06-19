"use client";

import type { Event } from "@/src/types/db";

interface EventTableProps {
  events: Event[];
  loadingEventId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onCreate: () => void;
}

const EventTable = ({
  events,
  loadingEventId,
  onEdit,
  onDelete,
  onCreate,
}: EventTableProps) => (
  <div className="animate-fade-in space-y-8">
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-in-up{animation:fadeInUp .25s ease-out forwards}`}</style>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-8 rounded-[2rem] border border-black/5 shadow-sm">
      <div>
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
          📅 Events Database
        </h3>
        <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
          Manage {events.length} experience{events.length !== 1 ? "s" : ""} total
        </p>
      </div>
      <button
        onClick={onCreate}
        className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#FACC15] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-black hover:text-white transition-all shadow-lg shadow-[#FACC15]/20 text-[11px] md:text-xs"
      >
        + Add New Event
      </button>
    </div>

    {events.length === 0 ? (
      <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 md:p-16 text-center">
        <p className="text-lg md:text-xl font-bold text-zinc-400 uppercase tracking-wide">
          No events created yet
        </p>
        <p className="text-xs md:text-sm text-zinc-300 mt-2">
          Click &quot;Add New Event&quot; to create your first experience
        </p>
      </div>
    ) : (
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 md:px-8 py-4 md:py-6 bg-zinc-50 border-b border-black/5">
          {["Event Title", "Date", "Category", "Venue", "Status", ""].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ${i === 5 ? "text-right" : ""}`}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y divide-black/5">
          {events.map((event: Event) => (
            <div key={event.id} className="fade-in-up">
              {/* Desktop row */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 md:px-8 py-4 md:py-6 items-center hover:bg-zinc-50/50 transition-colors group">
                <p className="font-bold text-xs md:text-sm uppercase tracking-tight">
                  {event.title}
                </p>
                <p className="text-[11px] md:text-xs font-bold text-zinc-500 uppercase">
                  {event.eventDate
                    ? new Date(event.eventDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "No Date"}
                </p>
                <span className="text-[9px] font-black uppercase tracking-widest border border-black/5 px-2 md:px-3 py-1 rounded-full bg-zinc-50 w-fit">
                  {event.eventType}
                </span>
                <p className="text-[11px] md:text-xs font-bold text-zinc-500 uppercase">
                  {event.venue || "—"}
                </p>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-full w-fit ${
                    event.status === "Success"
                      ? "bg-green-50 text-green-600"
                      : "bg-[#FACC15]/10 text-black"
                  }`}
                >
                  {event.status}
                </span>
                <div className="flex justify-end gap-2 md:gap-3">
                  <button
                    onClick={() => onEdit(String(event.id))}
                    disabled={loadingEventId === String(event.id)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all text-[11px] md:text-xs font-black whitespace-nowrap ${
                      loadingEventId === String(event.id)
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {loadingEventId === String(event.id) ? "..." : "✏️ Edit"}
                  </button>
                  <button
                    onClick={() => onDelete(String(event.id), event.title)}
                    disabled={loadingEventId === String(event.id)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all text-[11px] md:text-xs font-black whitespace-nowrap ${
                      loadingEventId === String(event.id)
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    {loadingEventId === String(event.id) ? "..." : "🗑️ Delete"}
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div className="sm:hidden p-4 border-b border-black/5 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-black uppercase tracking-tight truncate">
                      {event.title}
                    </p>
                    <p className="text-[11px] font-bold text-zinc-500 mt-0.5">
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "No Date"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => onEdit(String(event.id))}
                      disabled={loadingEventId === String(event.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(String(event.id), event.title)}
                      disabled={loadingEventId === String(event.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest border border-black/5 px-2 py-0.5 rounded-full bg-zinc-50">
                    {event.eventType}
                  </span>
                  {event.venue && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <span className="text-[11px] font-medium">{event.venue}</span>
                    </>
                  )}
                  <span className="text-zinc-300">·</span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      event.status === "Success" ? "text-green-600" : "text-black"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default EventTable;
