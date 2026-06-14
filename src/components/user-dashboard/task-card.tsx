"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { YoutubeModal } from "./youtube-modal";
import { FacebookModal } from "./facebook-modal";
import { InstagramModal } from "./instagram-modal";
import { SubscribeModal } from "./subscribe-modal";
import { YouTubeActionModal } from "./youtube-action-modal";
import { FlashCountdown } from "./flash-countdown";
import { useReward } from "@/src/components/rewards/reward-context";
import { UserTaskItem } from "@/src/services/task.service";
import { TaskActionButtons } from "@/src/components/tasks/TaskActionButtons";
import { useScreenshotUpload } from "@/src/hooks/useScreenshotUpload";

type TaskCardProps = {
  task: UserTaskItem;
  index: number;
  expandedTasks: Record<number, boolean>;
  onToggleExpand: (e: React.MouseEvent, taskId: number) => void;
  onPickup: (taskId: number) => void;
  onCancel: (taskId: number) => void;
  onComplete: (
    taskId: number,
    proofUrl: string,
    proofImageUrl?: string,
  ) => void;
  onClaimDailyLogin: (taskId: number) => void;
  onClaimProfile: (taskId: number) => void;
  onClaimReferral: (taskId: number) => void;
  pickupPending: boolean;
  pickupVariable: number | undefined;
  cancelPending: boolean;
  cancelVariable: number | undefined;
  onYoutubeComplete: (vars: {
    taskId: number;
    sessionId?: number;
    fingerprint?: string;
  }) => void;
  onModalComplete: (taskId: number, taskType?: string | null) => void;
  streak?: number;
};

// Left accent stripe color by difficulty
const difficultyAccent: Record<string, string> = {
  easy: "bg-emerald-400",
  medium: "bg-orange-400",
  hard: "bg-red-500",
};

// Difficulty badge styles
const difficultyBadge: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  medium: "bg-orange-50 text-orange-700 border border-orange-200",
  hard: "bg-red-50 text-red-700 border border-red-200",
};

// Platform icon background + color
function PlatformIcon({
  taskType,
  platform,
}: {
  taskType?: string | null;
  platform?: string | null;
}) {
  const type = (taskType ?? platform ?? "").toLowerCase();

  if (type.includes("facebook") || type.includes("fb"))
    return (
      <div className="w-9 h-9 rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </div>
    );

  if (type.includes("instagram") || type.includes("ig"))
    return (
      <div className="w-9 h-9 rounded-[10px] bg-pink-50 flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-pink-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>
    );

  if (type.includes("youtube") || type.includes("yt") || type.includes("video"))
    return (
      <div className="w-9 h-9 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-red-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 2-2 58.38 58.38 0 0 1 15 0 2 2 0 0 1 2 2 24.12 24.12 0 0 1 0 10 2 2 0 0 1-2 2 58.38 58.38 0 0 1-15 0 2 2 0 0 1-2-2z" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      </div>
    );

  if (type.includes("share") || type.includes("referral"))
    return (
      <div className="w-9 h-9 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" x2="12" y1="2" y2="15" />
        </svg>
      </div>
    );

  if (type.includes("daily") || type.includes("login"))
    return (
      <div className="w-9 h-9 rounded-[10px] bg-amber-50 flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-amber-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </div>
    );

  // Default
  return (
    <div className="w-9 h-9 rounded-[10px] bg-slate-100 flex items-center justify-center shrink-0">
      <svg
        className="w-5 h-5 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
  );
}

// Streak multiplier tooltip on Pick Up hover
function PickupTooltip({ points, streak }: { points: number; streak: number }) {
  const multiplier = streak >= 30 ? 1.5 : streak >= 7 ? 1.2 : 1.0;
  const bonus = Math.round(points * multiplier) - points;
  const total = points + bonus;

  return (
    <div className="absolute bottom-[calc(100%+6px)] right-0 z-20 bg-[#0f172a] rounded-xl p-2.5 w-[148px] shadow-lg pointer-events-none">
      <div className="flex justify-between text-[10px] text-white/40 mb-1">
        <span>Base</span>
        <span className="text-white/70">{points} pts</span>
      </div>
      {multiplier > 1 && (
        <div className="flex justify-between text-[10px] text-white/40 mb-1">
          <span>Streak {multiplier}×</span>
          <span className="text-orange-400">+{bonus} pts</span>
        </div>
      )}
      <div className="border-t border-white/10 pt-1 flex justify-between text-[10px]">
        <span className="text-white/50">You earn</span>
        <span className="text-[#FACC15] font-bold">{total} pts</span>
      </div>
      {multiplier === 1 && (
        <p className="text-[9px] text-white/30 mt-1 leading-tight">
          Daily streak unlocks a bonus multiplier
        </p>
      )}
    </div>
  );
}

export function TaskCard({
  task,
  index,
  expandedTasks,
  onToggleExpand,
  onPickup,
  onCancel,
  onComplete,
  onClaimDailyLogin,
  onClaimProfile,
  onClaimReferral,
  pickupPending,
  pickupVariable,
  cancelPending,
  cancelVariable,
  onYoutubeComplete,
  onModalComplete,
  streak = 0,
}: TaskCardProps) {
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const prevStatusRef = useRef(task.userStatus);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isYouTubeActionModalOpen, setIsYouTubeActionModalOpen] =
    useState(false);
  const [youtubeActionType, setYoutubeActionType] = useState<
    "like" | "comment"
  >("like");
  const { triggerReward } = useReward();
  const {
    previewUrl,
    isUploading,
    handleFileSelect,
    handleSubmit: handleScreenshotSubmit,
  } = useScreenshotUpload((url) => onComplete(task.id, url, url));

  useEffect(() => {
    async function loadFp() {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const { visitorId } = await fp.get();
        setFingerprint(visitorId);
      } catch {
        /* fingerprint capture not available */
      }
    }
    loadFp();
  }, []);

  const currentStatus = task.userStatus?.toLowerCase();
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (!currentStatus) return;
    if (prevStatus === currentStatus) return;
    if (
      currentStatus === "verified" ||
      currentStatus === "pending verification"
    ) {
      const msg = currentStatus === "verified" ? "Verified!" : "Submitted!";
      setSuccessMsg(msg);
      setShowSuccess(true);
      if (currentStatus === "verified" && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        triggerReward(
          rect.left + rect.width / 2,
          rect.top - 20,
          task.points || 0,
        );
      }
      setTimeout(() => setShowSuccess(false), 2000);
    }
    prevStatusRef.current = currentStatus;
  }, [currentStatus, task.points, triggerReward]);

  const getSystemClaimHandler = () => {
    const title = (task.title || "").toLowerCase();
    if (title.includes("daily") || title.includes("login"))
      return onClaimDailyLogin;
    if (title.includes("profile") || title.includes("complete profile"))
      return onClaimProfile;
    if (title.includes("referral")) return onClaimReferral;
    return null;
  };

  const requiredSeconds: number = task.watchDuration ?? 30;
  const completedStatuses = new Set([
    "verified",
    "completed",
    "cancelled",
    "pending verification",
  ]);
  const isFinalStatus =
    task.userStatus && completedStatuses.has(task.userStatus.toLowerCase());
  const difficulty = (task.difficulty ?? "easy").toLowerCase();
  const accentClass = difficultyAccent[difficulty] ?? difficultyAccent.easy;
  const badgeClass = difficultyBadge[difficulty] ?? difficultyBadge.easy;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06, ease: "easeOut" }}
      className={`relative bg-white border border-black/[0.07] rounded-[14px] overflow-hidden
                  transition-all duration-200
                  ${isFinalStatus ? "opacity-50 saturate-0" : "hover:border-black/[0.14] hover:shadow-sm cursor-pointer"}`}
    >
      {/* Left accent stripe */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentClass}`}
      />

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[14px] bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
            <p className="text-white font-black text-sm mt-2">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pl-4 pr-4 py-3.5 flex items-center gap-3">
        {/* Platform icon */}
        <PlatformIcon taskType={task.taskType} platform={task.platform} />

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="text-[13px] font-semibold text-slate-900 leading-snug truncate">
              {task.title}
            </h3>
            {/* Difficulty badge top-right on mobile */}
            {/* Difficulty badge top-right on mobile */}
            <div className="shrink-0 flex items-center gap-1.5">
              {task.isFlash && task.expiresAt && (
                <FlashCountdown expiresAt={task.expiresAt} />
              )}
              {task.isShare && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  Share
                </span>
              )}
              {task.difficulty && (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
                >
                  {task.difficulty}
                </span>
              )}
            </div>
          </div>

          <p
            className={`text-[11px] text-slate-400 leading-snug ${!expandedTasks[task.id] ? "line-clamp-1" : ""}`}
          >
            {task.description}
          </p>

          {(task.description?.length ?? 0) > 70 && (
            <button
              onClick={(e) => onToggleExpand(e, task.id)}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 mt-0.5 transition-colors"
            >
              {expandedTasks[task.id] ? "See less" : "See more"}
            </button>
          )}

          {task.postUrl?.startsWith("https://") && (
            <a
              href={task.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 mt-0.5 block"
              onClick={(e) => e.stopPropagation()}
            >
              ↗ Visit Post
            </a>
          )}
        </div>

        {/* Right: points + action */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[11px] font-bold text-slate-500">
            +{task.points} pts
          </span>

          {/* Action button / status */}
          {task.isExpired ? (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Expired
            </span>
          ) : task.platform === "system" ? (
            !task.userStatus ||
            task.userStatus.toLowerCase() === "in progress" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const handler = getSystemClaimHandler();
                  if (handler) {
                    triggerReward(e.clientX, e.clientY, task.points || 0);
                    handler(task.id);
                  }
                }}
                className="text-[11px] font-bold text-[#0f172a] bg-[#FACC15] hover:bg-[#eab308]
                           px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Claim
              </button>
            ) : (
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                ${
                  task.userStatus.toLowerCase() === "verified"
                    ? "bg-emerald-100 text-emerald-700"
                    : task.userStatus.toLowerCase() === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {task.userStatus}
              </span>
            )
          ) : task.userStatus ? (
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                ${
                  task.userStatus.toLowerCase() === "verified"
                    ? "bg-emerald-100 text-emerald-700"
                    : task.userStatus.toLowerCase() === "pending verification"
                      ? "bg-amber-100 text-amber-700"
                      : task.userStatus.toLowerCase() === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700 animate-pulse"
                }`}
              >
                {task.userStatus}
              </span>

              {task.userStatus.toLowerCase() === "rejected" ? (
                <button
                  onClick={() => onPickup(task.id)}
                  disabled={pickupPending}
                  className="text-[11px] font-bold text-[#0f172a] bg-[#FACC15] hover:bg-[#eab308]
                             px-3 py-1.5 rounded-full transition-all duration-200
                             hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pickupPending && pickupVariable === task.id
                    ? "..."
                    : "Re-claim →"}
                </button>
              ) : task.userStatus.toLowerCase() === "in progress" ? (
                <TaskActionButtons
                  task={task}
                  cancelPending={cancelPending}
                  cancelVariable={cancelVariable}
                  fingerprint={fingerprint}
                  previewUrl={previewUrl}
                  isUploading={isUploading}
                  onCancel={onCancel}
                  onComplete={onComplete}
                  onOpenFacebook={() => setIsFacebookModalOpen(true)}
                  onOpenInstagram={() => setIsInstagramModalOpen(true)}
                  onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
                  onOpenYouTubeAction={(type) => {
                    setYoutubeActionType(type);
                    setIsYouTubeActionModalOpen(true);
                  }}
                  onOpenYoutube={() => setIsYoutubeModalOpen(true)}
                  onScreenshotFileSelect={handleFileSelect}
                  onScreenshotSubmit={handleScreenshotSubmit}
                />
              ) : null}
            </div>
          ) : (
            /* Pick Up button with tooltip */
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.14 }}
                  >
                    <PickupTooltip points={task.points || 0} streak={streak} />
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => onPickup(task.id)}
                disabled={pickupPending}
                className="text-[11px] font-bold text-[#0f172a] bg-[#FACC15] hover:bg-[#eab308]
                           px-3 py-1.5 rounded-full transition-all duration-200
                           hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                           whitespace-nowrap"
              >
                {pickupPending && pickupVariable === task.id
                  ? "..."
                  : "Pick Up →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <YoutubeModal
        url={task.postUrl || ""}
        taskId={task.id}
        isOpen={isYoutubeModalOpen}
        onClose={() => setIsYoutubeModalOpen(false)}
        onComplete={(_watchedSeconds, sessionId) => {
          onYoutubeComplete({ taskId: task.id, sessionId, fingerprint });
        }}
        requiredSeconds={requiredSeconds}
      />
      <FacebookModal
        task={task}
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
        onComplete={() => {
          onModalComplete(task.id, task.taskType);
        }}
        fingerprint={fingerprint}
      />
      <InstagramModal
        task={task}
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        onComplete={() => {
          onModalComplete(task.id, task.taskType);
        }}
        fingerprint={fingerprint}
      />
      <SubscribeModal
        task={task}
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        onComplete={() => {
          onModalComplete(task.id, task.taskType);
        }}
      />
      <YouTubeActionModal
        task={task}
        action={youtubeActionType}
        isOpen={isYouTubeActionModalOpen}
        onClose={() => setIsYouTubeActionModalOpen(false)}
        onComplete={() => {
          onModalComplete(task.id, task.taskType);
        }}
      />
    </motion.div>
  );
}
