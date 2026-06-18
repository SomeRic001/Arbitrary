// leaderboard-list.tsx — redesigned + enhanced animations

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TopUser, UserRankInfo } from "@/src/db/user-queries";
import Image from "next/image";

interface LeaderboardListProps {
  users: TopUser[];
  currentUserId?: number;
  /** Populated by the server only when the current user is NOT in the top-100 list */
  currentUserRankInfo?: UserRankInfo | null;
}

const TIER_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  bronze: {
    label: "Bronze",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FCD34D",
  },
  silver: {
    label: "Silver",
    color: "#475569",
    bg: "#F1F5F9",
    border: "#CBD5E1",
  },
  gold: { label: "Gold", color: "#A16207", bg: "#FEF9C3", border: "#FDE047" },
  elite: { label: "Elite", color: "#5B21B6", bg: "#EDE9FE", border: "#C4B5FD" },
};

const MEDALS = ["🥇", "🥈", "🥉"];

const TOP_BG = ["bg-[#FEFCE8]", "bg-[#FAFAFA]", "bg-[#FFF8F3]"];

// Easing curves
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
const EASE_SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({
  src,
  name,
  rank,
  isMe,
}: {
  src: string | null;
  name: string | null;
  rank: number;
  isMe: boolean;
}) {
  const ringStyles: Record<number, string> = {
    1: "border-[#FDE047] bg-[#FEF9C3] text-[#A16207]",
    2: "border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]",
    3: "border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]",
  };
  const base = isMe
    ? "border-[#FACC15] bg-[#FEF9C3] text-[#A16207]"
    : (ringStyles[rank] ?? "border-black/10 bg-zinc-100 text-zinc-500");

  const cls = `w-9 h-9 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center text-[11px] font-medium ${base}`;

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "User"}
        width={36}
        height={36}
        className={`w-9 h-9 rounded-full object-cover border-[1.5px] flex-shrink-0 ${base}`}
      />
    );
  }
  return <div className={cls}>{getInitials(name)}</div>;
}

function TierBadge({ tier }: { tier: string }) {
  const meta = TIER_META[tier] ?? TIER_META.bronze;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{
        background: meta.bg,
        color: meta.color,
        border: `0.5px solid ${meta.border}`,
      }}
    >
      {meta.label}
    </span>
  );
}

function LeaderboardRow({
  user,
  rank,
  isCurrentUser,
  index,
}: {
  user: TopUser;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) {
  const isTop3 = rank <= 3;
  const rowBg = isCurrentUser
    ? "bg-[#FFFBEB] border-l-2 border-l-[#FACC15]"
    : isTop3
      ? TOP_BG[rank - 1]
      : "";

  // Top-3 rows slide in from the left with a longer travel; rest fade up normally
  const initial = isTop3
    ? { opacity: 0, x: -32, scale: 0.98 }
    : { opacity: 0, y: 20 };

  const animate = isCurrentUser
    ? { opacity: 1, x: 0, y: 0, scale: [1, 1.012, 1] } // subtle pulse for "You" row
    : { opacity: 1, x: 0, y: 0, scale: 1 };

  const transition = isTop3
    ? {
        duration: 0.55,
        delay: index * 0.08, // top-3 stagger is more deliberate
        ease: EASE_OUT_QUART,
        scale: { duration: 0.4, times: [0, 0.5, 1] },
      }
    : {
        duration: 0.38,
        delay: Math.min(0.24 + index * 0.04, 1.0), // rest starts after top-3 lands
        ease: EASE_OUT_QUART,
      };

  return (
    <motion.div
      layout
      initial={initial}
      animate={animate}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={transition}
      whileHover={
        isTop3
          ? { x: 5, transition: { ...EASE_SPRING } }
          : { x: 3, transition: { ...EASE_SPRING } }
      }
      className={[
        "grid grid-cols-[44px_40px_1fr_auto] gap-3 px-4 py-3 items-center",
        "border-b border-black/5 last:border-b-0",
        "hover:bg-zinc-50 transition-colors cursor-default",
        rowBg,
      ].join(" ")}
    >
      {/* Rank */}
      <motion.div
        className="flex items-center justify-center w-11"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          ...EASE_SPRING,
          delay: isTop3
            ? index * 0.08 + 0.15
            : Math.min(0.24 + index * 0.04 + 0.1, 1.1),
        }}
      >
        {rank <= 3 ? (
          <span className="text-xl">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="text-xs font-medium text-zinc-400 tabular-nums">
            #{rank}
          </span>
        )}
      </motion.div>

      {/* Avatar */}
      <Avatar
        src={user.image}
        name={user.name}
        rank={rank}
        isMe={isCurrentUser}
      />

      {/* Name + tier + pts */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-sm font-medium truncate ${isCurrentUser ? "text-[#A16207]" : "text-zinc-800"}`}
          >
            {user.name ?? "Anonymous"}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] font-medium text-[#A16207] bg-[#FEF9C3] border border-[#FDE047] rounded px-1 py-0.5">
              You
            </span>
          )}
          <TierBadge tier={user.tier} />
        </div>
        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
          <span className="text-[#FACC15] text-[8px]">✦</span>
          {user.points.toLocaleString()} pts
        </p>
      </div>

      {/* Stats — count-up feel via staggered entrance */}
      <motion.div
        className="flex items-center gap-3 justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.3,
          delay: isTop3
            ? index * 0.08 + 0.3
            : Math.min(0.24 + index * 0.04 + 0.2, 1.2),
        }}
      >
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#A16207]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium text-[#A16207]">{user.tasks}</span>
          <span className="hidden md:inline text-zinc-400">tasks</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="font-medium">{user.referrals}</span>
          <span className="hidden md:inline text-zinc-400">refs</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

function CurrentUserStickyRow({
  user,
  rank,
  outsideTop100 = false,
}: {
  user: TopUser;
  rank: number;
  outsideTop100?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
      className="sticky bottom-0 bg-[#FFFBEB] border-t border-[#FACC15]/50 shadow-[0_-4px_20px_rgba(250,204,21,0.1)]"
    >
      {outsideTop100 && (
        <div className="px-4 pt-2 pb-0">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            Your ranking
          </p>
        </div>
      )}
      <div className="grid grid-cols-[44px_40px_1fr_auto] gap-3 px-4 py-3 items-center border-l-2 border-l-[#FACC15]">
        <div className="flex items-center justify-center w-11">
          {rank <= 3 ? (
            <span className="text-xl">{MEDALS[rank - 1]}</span>
          ) : (
            <span className="text-xs font-medium text-zinc-400">#{rank}</span>
          )}
        </div>
        <Avatar src={user.image} name={user.name} rank={rank} isMe />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-[#A16207] truncate">
              {user.name ?? "Anonymous"}
            </span>
            <span className="text-[10px] font-medium text-[#A16207] bg-[#FEF9C3] border border-[#FDE047] rounded px-1 py-0.5">
              You
            </span>
            <TierBadge tier={user.tier} />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
            <span className="text-[#FACC15] text-[8px]">✦</span>
            {user.points.toLocaleString()} pts
          </p>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <span className="flex items-center gap-1 text-xs">
            <span className="font-medium text-[#A16207]">{user.tasks}</span>
            <span className="text-zinc-400 hidden md:inline">tasks</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="font-medium">{user.referrals}</span>
            <span className="text-zinc-400 hidden md:inline">refs</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardList({
  users,
  currentUserId,
  currentUserRankInfo,
}: LeaderboardListProps) {
  const [search, setSearch] = useState("");

  const rankedUsers = useMemo(
    () => users.map((u, i) => ({ ...u, rank: i + 1 })),
    [users],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return rankedUsers;
    const q = search.toLowerCase();
    return rankedUsers.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.id.toString().includes(q),
    );
  }, [rankedUsers, search]);

  const currentUserData = useMemo(() => {
    if (!currentUserId) return null;
    const idx = rankedUsers.findIndex((u) => u.id === currentUserId);
    return idx === -1 ? null : rankedUsers[idx];
  }, [rankedUsers, currentUserId]);

  const currentUserVisible =
    currentUserData && filtered.some((u) => u.id === currentUserId);

  return (
    <div className="w-full flex flex-col">
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-black/5 px-4 py-3"
      >
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-zinc-50 border border-black/8 rounded-lg text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15]/40 transition-all"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Column header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="hidden md:grid grid-cols-[44px_40px_1fr_auto] gap-3 px-4 py-2.5 border-b border-black/5"
      >
        <span />
        <span />
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
          User
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
          Stats
        </span>
      </motion.div>

      {/* Rows */}
      <AnimatePresence mode="popLayout">
        <div key="rows">
          {filtered.map((user, index) => (
            <LeaderboardRow
              key={user.id}
              user={user}
              rank={user.rank}
              index={index}
              isCurrentUser={user.id === currentUserId}
            />
          ))}
        </div>
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="text-center py-16 text-zinc-400"
          >
            <motion.p
              animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl mb-3"
            >
              🔍
            </motion.p>
            <p className="text-sm font-medium">
              No users match &quot;{search}&quot;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky current user — two cases:
          1. User IS in the top-100 but has scrolled out of view → show without "Your ranking" label
          2. User is NOT in the top-100 at all → show with "Your ranking" label using server-fetched rank */}
      <AnimatePresence>
        {currentUserData && !currentUserVisible && (
          <CurrentUserStickyRow
            user={currentUserData}
            rank={currentUserData.rank}
          />
        )}
        {!currentUserData && currentUserRankInfo && (
          <CurrentUserStickyRow
            user={currentUserRankInfo}
            rank={currentUserRankInfo.rank}
            outsideTop100
          />
        )}
      </AnimatePresence>
    </div>
  );
}
