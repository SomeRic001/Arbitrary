"use client";

import { useState, useEffect, useMemo } from "react";

interface OutletUser {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    registrationName: string | null;
    registrationEmail: string | null;
    phone: string | null;
    address: string | null;
    submittedAt: string | null;
}

export default function TiltAdminPage() {
    const [users, setUsers] = useState<OutletUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/tilt/admin/users")
            .then(async (r) => {
                if (!r.ok) return;
                const data = await r.json();
                setUsers(data.users ?? []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.toLowerCase();
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.phone && u.phone.includes(q))
        );
    }, [users, search]);

    const registered = users.filter((u) => u.submittedAt).length;
    const formatDate = (d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Outlets</h1>
                <p className="text-sm font-medium mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {isLoading ? "Loading…" : `${users.length} total`}
                </p>
            </div>

            {/* Stat row */}
            <div className="flex gap-4 mb-8">
                <div className="flex-1 rounded-xl border px-5 py-4" style={{ borderColor: "rgba(200,230,60,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(200,230,60,0.45)" }}>Total</p>
                    <p className="text-2xl font-black text-white mt-1">{users.length}</p>
                </div>
                <div className="flex-1 rounded-xl border px-5 py-4" style={{ borderColor: "rgba(200,230,60,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(200,230,60,0.45)" }}>Registered</p>
                    <p className="text-2xl font-black text-white mt-1">{registered}</p>
                </div>
                <div className="flex-1 rounded-xl border px-5 py-4" style={{ borderColor: "rgba(200,230,60,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(200,230,60,0.45)" }}>Pending</p>
                    <p className="text-2xl font-black text-white mt-1">{users.length - registered}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(200,230,60,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder="Search outlets…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%", padding: "10px 14px 10px 38px",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,230,60,0.1)",
                        borderRadius: "10px", color: "#fff", fontSize: "13px",
                        outline: "none", fontFamily: "inherit",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,230,60,0.3)" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(200,230,60,0.1)" }}
                />
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: "2px solid rgba(200,230,60,0.15)", borderTop: "2px solid #c8e63c",
                        animation: "spin 0.8s linear infinite",
                    }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    {search ? (
                        <>
                            <p className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>
                                No outlets match &ldquo;{search}&rdquo;
                            </p>
                            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                                Try a different name or email
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>
                                No outlets registered yet
                            </p>
                            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                                Outlets will appear here once they sign up
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(200,230,60,0.08)" }}>
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ background: "rgba(200,230,60,0.03)" }}>
                                <Th>Outlet</Th>
                                <Th>Email</Th>
                                <Th>Contact</Th>
                                <Th>Status</Th>
                                <Th>Joined</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr
                                    key={u.id}
                                    className="transition-all duration-150"
                                    style={{ borderTop: "1px solid rgba(200,230,60,0.05)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,230,60,0.03)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                >
                                    <Td>
                                        <span className="font-bold text-white">{u.name}</span>
                                    </Td>
                                    <Td>
                                        <span style={{ color: "rgba(200,230,60,0.7)" }}>{u.email}</span>
                                    </Td>
                                    <Td>{u.phone ?? "—"}</Td>
                                    <Td>
                                        {u.submittedAt ? (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
                                                style={{ color: "#c8e63c" }}>
                                                <span style={{
                                                    width: "5px", height: "5px", borderRadius: "50%",
                                                    background: "#c8e63c", display: "inline-block",
                                                    boxShadow: "0 0 6px rgba(200,230,60,0.5)",
                                                }} />
                                                Registered
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold uppercase tracking-wider"
                                                style={{ color: "rgba(255,255,255,0.2)" }}>
                                                Pending
                                            </span>
                                        )}
                                    </Td>
                                    <Td>{formatDate(u.createdAt)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(200,230,60,0.4)" }}>
            {children}
        </th>
    );
}

function Td({ children }: { children: React.ReactNode }) {
    return (
        <td className="px-5 py-4 text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            {children}
        </td>
    );
}
