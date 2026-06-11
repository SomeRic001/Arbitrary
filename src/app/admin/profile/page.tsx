"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, ExternalLink } from "lucide-react";
import DashboardShell from "@/src/app/admin/dashboard/_components/dashboard-shell";

interface ProfileUser {
  id: number;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  location: string | null;
  bio: string | null;
  role: string;
  createdAt: string | null;
  image: string | null;
}

interface ProfileStats {
  activeUsers: number;
  pointsDistributed: number;
  eventsManaged: number;
}

interface ActivityEntry {
  id: number;
  action: string;
  description: string;
  logLevel: string;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string | null;
}

const LOG_LEVEL_STYLES: Record<string, string> = {
  INFO: "border-l-green-500",
  WARNING: "border-l-yellow-500",
  CRITICAL: "border-l-red-500",
};

const LOG_LEVEL_DOTS: Record<string, string> = {
  INFO: "bg-green-500",
  WARNING: "bg-yellow-500",
  CRITICAL: "bg-red-500",
};

const ENTITY_ROUTES: Record<string, string> = {
  event: "/admin/dashboard/events",
  task: "/admin/dashboard/tasks",
  user: "/admin/dashboard/users",
  ticket: "/admin/dashboard/tickets",
  submission: "/admin/dashboard/submissions",
  record: "/admin/dashboard/records",
};

export default function AdminProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [savedForm, setSavedForm] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
  });

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error ?? "Failed to load profile");
          return;
        }
        setUser(d.user);
        setStats(d.stats);
        setActivity(d.recentActivity ?? []);
        const f = {
          name: d.user.name ?? "",
          phone: d.user.phoneNumber ?? "",
          location: d.user.location ?? "",
          bio: d.user.bio ?? "",
        };
        setForm(f);
        setSavedForm(f);
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/admin/activity-stream");

    es.addEventListener("log", (e: MessageEvent) => {
      try {
        const log = JSON.parse(e.data);
        setActivity((prev) => {
          if (prev.some((a) => a.id === log.id)) return prev;
          return [log, ...prev].slice(0, 100);
        });
      } catch {}
    });

    return () => es.close();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, ...data.user } : null));
        setSavedForm({ ...form });
        setIsEditing(false);
      }
    } catch {}
    setSaving(false);
  }, [form]);

  const handleDiscard = useCallback(() => {
    setForm({ ...savedForm });
    setIsEditing(false);
  }, [savedForm]);

  const initials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : (user?.email?.substring(0, 2).toUpperCase() ?? "AD");

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !user) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-sm font-bold text-red-500 mb-2">
              {error ?? "No user data"}
            </p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                window.location.reload();
              }}
              className="text-xs font-semibold text-zinc-500 underline"
            >
              Reload
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="animate-fade-in space-y-6">
        {/* Card 1 — Profile Hero */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm p-6 md:p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-[#FACC15] flex items-center justify-center">
                  <span className="text-black font-black text-lg">
                    {initials}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {user?.name ?? "Admin"}
                </h2>
                <p className="text-sm text-zinc-400 font-medium">
                  {user?.email}
                </p>
                <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black text-[#FACC15]">
                  ADMIN
                </span>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FACC15] text-black font-bold text-sm hover:bg-[#eab308] transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "SAVE"}
                </button>
                <button
                  onClick={handleDiscard}
                  className="px-5 py-2 rounded-xl border border-black/10 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>

          {/* 2-column field grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field
              label="FULL NAME"
              value={form.name}
              readOnly={!isEditing}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <Field
              label="EMAIL ADDRESS"
              value={user?.email ?? ""}
              readOnly={true}
            />
            <Field
              label="PHONE NUMBER"
              value={form.phone}
              readOnly={!isEditing}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <Field
              label="LOCATION"
              value={form.location}
              readOnly={!isEditing}
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            />
            <Field
              label="MEMBER SINCE"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"
              }
              readOnly={true}
            />
            <Field
              label="ROLE"
              value={user?.role === "ADMIN" ? "ADMIN" : (user?.role ?? "—")}
              readOnly={true}
            />
          </div>

          {/* BIO field */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
              BIO
            </label>
            {isEditing ? (
              <div>
                <textarea
                  value={form.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setForm((f) => ({ ...f, bio: e.target.value }));
                    }
                  }}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-[10px] text-zinc-400 font-medium mt-1.5 text-right">
                  {form.bio.length}/200
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600 leading-relaxed">
                {user?.bio || "No bio added yet."}
              </p>
            )}
          </div>

          {/* Discard link */}
          {isEditing && (
            <button
              onClick={handleDiscard}
              className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
            >
              Discard changes
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Active Users"
            value={stats?.activeUsers.toLocaleString() ?? "—"}
            sub="Last 30 days"
          />
          <StatCard
            label="Points Distributed"
            value={stats?.pointsDistributed.toLocaleString() ?? "—"}
            sub="Across all users"
          />
          <StatCard
            label="Events Managed"
            value={stats?.eventsManaged.toLocaleString() ?? "—"}
            sub="Total events"
          />
        </div>

        {/* Recent Activity + Permissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity — white card */}
          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">
                Recent Activity
              </h3>
              {activity.length > 0 && (
                <span className="text-[10px] font-medium text-zinc-400">
                  {activity.length} entries
                </span>
              )}
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-400">No recent activity.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {activity.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>

          {/* Permissions — dark card */}
          <div className="bg-[#0f0f0f] text-white rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6 text-[#FACC15]">
              Permissions
            </h3>
            <div className="space-y-4">
              <PermissionRow label="Manage events" status="on" />
              <PermissionRow label="Manage records" status="on" />
              <PermissionRow label="Manage tasks" status="on" />
              <PermissionRow label="Manage submissions" status="on" />
              <PermissionRow label="Fraud detection" status="on" />
              <PermissionRow label="Scanner access" status="on" />
              <PermissionRow label="View analytics" status="on" />
              <PermissionRow label="Delete records" status="on" />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const borderColor = LOG_LEVEL_STYLES[entry.logLevel] ?? "border-l-zinc-300";
  const dotColor = LOG_LEVEL_DOTS[entry.logLevel] ?? "bg-zinc-300";
  const route = ENTITY_ROUTES[entry.entityType];
  const href =
    route && entry.entityId != null ? `${route}?id=${entry.entityId}` : null;

  return (
    <div
      className={`flex items-start gap-3 pl-3 border-l-2 ${borderColor} py-2`}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-zinc-700">{entry.description}</p>
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
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-zinc-400 font-medium">
            {entry.createdAt
              ? new Date(entry.createdAt).toLocaleString()
              : ""}
          </p>
          {entry.logLevel && entry.logLevel !== "INFO" && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                entry.logLevel === "CRITICAL"
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {entry.logLevel}
            </span>
          )}
          {entry.ipAddress && (
            <span className="text-[9px] text-zinc-300 font-mono">
              {entry.ipAddress}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
        {label}
      </label>
      {readOnly ? (
        <p className="text-sm font-medium text-zinc-700">{value || "—"}</p>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30"
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-zinc-50 rounded-[2rem] p-6 md:p-8">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">
        {label}
      </p>
      <h3 className="text-2xl md:text-3xl font-black mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-green-500 uppercase tracking-tight">
        {sub}
      </p>
    </div>
  );
}

function PermissionRow({
  label,
  status,
}: {
  label: string;
  status: "on" | "restricted";
}) {
  const isOn = status === "on";
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <span
        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
          isOn ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {isOn ? "On" : "Restricted"}
      </span>
    </div>
  );
}
