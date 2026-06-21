"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Pencil,
  Check,
  Shield,
  ShieldOff,
  Clock,
  MapPin,
  KeyRound,
} from "lucide-react";
import DashboardShell from "@/src/app/admin/dashboard/_components/dashboard-shell";
import ActivityFeed, {
  type ActivityFeedEntry,
} from "@/src/app/admin/dashboard/_components/activity-feed";

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
  lastLoginAt: string | null;
}

interface AccountSecurity {
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  twoFactorEnabled: boolean | null;
  passwordLastChangedAt: string | null;
}

interface AdminImpact {
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  recordsModified: number;
  ticketsRedeemed: number;
  totalActions: number;
  criticalActions: number;
}

interface SseLogRaw {
  id: number;
  admin_id: number;
  action: string;
  description: string;
  log_level: string;
  entity_type: string;
  entity_id: number | null;
  ip_address?: string | null;
  created_at: string | null;
  __replay?: boolean;
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [accountSecurity, setAccountSecurity] =
    useState<AccountSecurity | null>(null);
  const [adminImpact, setAdminImpact] = useState<AdminImpact | null>(null);
  const [activity, setActivity] = useState<ActivityFeedEntry[]>([]);
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
        setAccountSecurity(d.accountSecurity ?? null);
        setAdminImpact(d.adminImpact ?? null);
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
    if (!user) return;
    const es = new EventSource("/api/admin/activity-stream");

    es.addEventListener("log", (e: MessageEvent) => {
      try {
        const raw: SseLogRaw = JSON.parse(e.data);
        // This feed shows only this admin's own activity.
        if (raw.admin_id !== user.id) return;
        const entry: ActivityFeedEntry = {
          id: raw.id,
          description: raw.description,
          logLevel: raw.log_level,
          entityType: raw.entity_type,
          entityId: raw.entity_id,
          ipAddress: raw.ip_address ?? null,
          createdAt: raw.created_at,
        };
        setActivity((prev) => {
          if (prev.some((a) => a.id === entry.id)) return prev;
          return [entry, ...prev].slice(0, 100);
        });
      } catch {}
    });

    return () => es.close();
  }, [user]);

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

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
              BIO
            </label>
            {isEditing ? (
              <div>
                <textarea
                  value={form.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 200)
                      setForm((f) => ({ ...f, bio: e.target.value }));
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

          {isEditing && (
            <button
              onClick={handleDiscard}
              className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
            >
              Discard changes
            </button>
          )}
        </div>

        {/* Admin Impact */}
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 px-1">
            Admin Impact
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              label="Events Created"
              value={adminImpact?.eventsCreated.toLocaleString() ?? "—"}
              sub={`${adminImpact?.eventsUpdated ?? 0} updated · ${adminImpact?.eventsDeleted ?? 0} deleted`}
            />
            <StatCard
              label="Records Modified"
              value={adminImpact?.recordsModified.toLocaleString() ?? "—"}
              sub="Created, updated or deleted"
            />
            <StatCard
              label="Tickets Redeemed"
              value={adminImpact?.ticketsRedeemed.toLocaleString() ?? "—"}
              sub="Scanned by this admin"
            />
            <StatCard
              label="Total Actions Logged"
              value={adminImpact?.totalActions.toLocaleString() ?? "—"}
              sub={`${adminImpact?.criticalActions ?? 0} flagged critical`}
              warn={!!adminImpact?.criticalActions}
            />
          </div>
        </div>

        {/* Recent Activity + Account Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ActivityFeed
            entries={activity}
            title="Recent Activity"
            emptyMessage="No recent activity."
            showLevelFilter
          />

          {/* Account Security — dark card */}
          <div className="bg-[#0f0f0f] text-white rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6 text-[#FACC15]">
              Account Security
            </h3>
            <div className="space-y-5">
              <SecurityRow
                icon={<Clock className="w-4 h-4" />}
                label="Last login"
                value={
                  accountSecurity?.lastLoginAt
                    ? new Date(accountSecurity.lastLoginAt).toLocaleString()
                    : "Not available"
                }
                available={!!accountSecurity?.lastLoginAt}
              />
              <SecurityRow
                icon={<MapPin className="w-4 h-4" />}
                label="Last login IP"
                value={accountSecurity?.lastLoginIp ?? "Not tracked"}
                available={!!accountSecurity?.lastLoginIp}
              />
              <SecurityRow
                icon={
                  accountSecurity?.twoFactorEnabled ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <ShieldOff className="w-4 h-4" />
                  )
                }
                label="Two-factor authentication"
                value={
                  accountSecurity?.twoFactorEnabled == null
                    ? "Not available"
                    : accountSecurity.twoFactorEnabled
                      ? "Enabled"
                      : "Disabled"
                }
                available={accountSecurity?.twoFactorEnabled != null}
              />
              <SecurityRow
                icon={<KeyRound className="w-4 h-4" />}
                label="Password last changed"
                value={
                  accountSecurity?.passwordLastChangedAt
                    ? new Date(
                        accountSecurity.passwordLastChangedAt,
                      ).toLocaleDateString()
                    : "Not tracked"
                }
                available={!!accountSecurity?.passwordLastChangedAt}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-medium mt-6 leading-relaxed">
              Fields marked &quot;Not tracked&quot; require backend support that
              doesn&apos;t exist yet — see the implementation notes for
              what&apos;s needed.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SecurityRow({
  icon,
  label,
  value,
  available,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  available: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-zinc-500 shrink-0">{icon}</span>
        <span className="text-sm font-semibold text-zinc-300">{label}</span>
      </div>
      <span
        className={`text-xs font-bold text-right shrink-0 ${available ? "text-white" : "text-zinc-600 italic"}`}
      >
        {value}
      </span>
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
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-zinc-50 rounded-[2rem] p-5 md:p-8">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">
        {label}
      </p>
      <h3 className="text-2xl md:text-3xl font-black mb-1">{value}</h3>
      <p
        className={`text-[10px] font-bold uppercase tracking-tight ${warn ? "text-red-500" : "text-green-500"}`}
      >
        {sub}
      </p>
    </div>
  );
}
