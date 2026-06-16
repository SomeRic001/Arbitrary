"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";

import { Task } from "@/src/lib/manage-task/types";
import { Platform } from "@/src/lib/social/type";
import { ModalShell } from "./ModalShell";
import { PlatformBadge } from "./PlatformBadge";
import { TaskFormPayload } from "./TaskFormModal";

// ── Shared input/label styles (match TaskFormModal) ──────────────────────────
const inputClass =
  "w-full px-4 py-2.5 bg-zinc-50 border border-black/5 rounded-2xl text-sm font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-[#FACC15] transition-all";
const labelClass =
  "block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5";

// ── Editable form state ───────────────────────────────────────────────────────
type EditState = {
  title: string;
  description: string;
  rewardPoint: number;
  videoUrl: string;
  socialPostUrl: string;
  commentInstruction: string;
  watchDuration: number;
  platform: Platform | "";
  isRecurring: boolean;
};

function taskToEditState(task: Task): EditState {
  return {
    title: task.title ?? "",
    description: task.description ?? "",
    rewardPoint: task.rewardPoint ?? 0,
    videoUrl: task.videoUrl ?? "",
    socialPostUrl: task.socialPostUrl ?? "",
    commentInstruction: task.commentInstruction ?? "",
    watchDuration: task.watchDuration ?? 30,
    platform: task.platform ?? "",
    isRecurring: task.isRecurring ?? false,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  task: Task;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: (id: Task["id"]) => void;
  onEdit: (task: Task) => void;
  /** Called when inline save is used — saves without opening another modal */
  onSave?: (id: Task["id"], payload: Partial<TaskFormPayload>) => void;
  isSaving?: boolean;
};

export function TaskDetailsModal({
  task,
  isDeleting,
  onClose,
  onDelete,
  onEdit,
  onSave,
  isSaving = false,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>(taskToEditState(task));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EditState, string>>
  >({});

  const isYoutube = task.platform === "youtube";
  const isFacebook = task.platform === "facebook";
  const isInstagram = task.platform === "instagram";
  const needsYoutubeUrl = isYoutube;

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<Record<keyof EditState, string>> = {};
    if (!editState.title.trim()) errs.title = "Title is required";
    if (!editState.description.trim())
      errs.description = "Description is required";
    if (!editState.rewardPoint || editState.rewardPoint < 1)
      errs.rewardPoint = "Must be at least 1 point";
    if (needsYoutubeUrl && !editState.videoUrl.trim())
      errs.videoUrl = "YouTube video URL is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    if (onSave) {
      onSave(task.id, {
        title: editState.title,
        description: editState.description,
        rewardPoint: editState.rewardPoint,
        videoUrl: needsYoutubeUrl
          ? editState.videoUrl
          : (task.videoUrl ?? null),
        socialPostUrl: editState.socialPostUrl || task.socialPostUrl || null,
        commentInstruction: editState.commentInstruction || null,
        watchDuration:
          isYoutube && task.taskType === "video_watch"
            ? editState.watchDuration
            : null,
        isRecurring: editState.isRecurring,
        // Carry forward fields not edited inline
        taskType: task.taskType,
        platform: task.platform ?? null,
        socialPostId: task.socialPostId ?? null,
        isActive: task.isActive ?? true,
        difficulty:
          editState.rewardPoint <= 10
            ? "easy"
            : editState.rewardPoint <= 25
              ? "medium"
              : "hard",
        isFlash: task.isFlash ?? false,
        isShare: task.isShare ?? false,
        shareThreshold: task.shareThreshold ?? 3,
        expiresAt: task.expiresAt ?? null,
        socialPlatform: task.socialPlatform ?? null,
        targetUrl: task.targetUrl ?? null,
      });
    } else {
      // Fallback: open the old edit form
      onEdit(task);
    }
  };

  const handleCancel = () => {
    setEditState(taskToEditState(task));
    setErrors({});
    setIsEditing(false);
  };

  const set = <K extends keyof EditState>(key: K, value: EditState[K]) => {
    setEditState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Header extras ────────────────────────────────────────────────────────
  const headerExtras = (
    <>
      <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
        ✦ {isEditing ? editState.rewardPoint : (task.rewardPoint ?? "—")} pts
        reward
      </span>
      {task.platform && <PlatformBadge platform={task.platform} />}
    </>
  );

  // ── Footer ───────────────────────────────────────────────────────────────
  const footer = isEditing ? (
    <>
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        <X className="w-3 h-3" />
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black bg-[#FACC15] hover:bg-black hover:text-[#FACC15] rounded-2xl transition-all disabled:opacity-50 flex items-center gap-1.5"
      >
        <Check className="w-3 h-3" />
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </>
  ) : (
    <>
      <button
        onClick={onClose}
        className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors"
      >
        Close
      </button>
      {showDeleteConfirm ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <button
            onClick={() => {
              setEditState(taskToEditState(task));
              setErrors({});
              setIsEditing(true);
            }}
            className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black bg-[#FACC15] hover:bg-black hover:text-[#FACC15] rounded-2xl transition-all flex items-center gap-1.5"
          >
            <Pencil className="w-3 h-3" />
            Edit Task
          </button>
        </div>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ModalShell
      onClose={isEditing ? undefined : onClose}
      title={isEditing ? "Edit Task" : task.title}
      subtitle={isEditing ? "Editing" : "Task Details"}
      headerExtras={headerExtras}
      footer={footer}
      scrollableBody
    >
      <div className="px-6 pb-6 space-y-5">
        {/* Edit mode banner */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 p-3 bg-[#FACC15]/10 border border-[#FACC15]/30 rounded-2xl"
            >
              <Pencil className="w-3.5 h-3.5 text-[#FACC15]" />
              <p className="text-xs font-bold text-black/70">
                Editing task — changes save directly to this task.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Title ── */}
        {isEditing && (
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={editState.title}
              onChange={(e) => set("title", e.target.value)}
              className={`${inputClass} ${errors.title ? "border-red-400 focus:border-red-400" : ""}`}
              placeholder="Task title"
            />
            {errors.title && (
              <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>
        )}

        {/* ── Description ── */}
        <div>
          <label className={labelClass}>Description</label>
          {isEditing ? (
            <>
              <textarea
                value={editState.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={`${inputClass} resize-none ${errors.description ? "border-red-400 focus:border-red-400" : ""}`}
                placeholder="Task description..."
              />
              {errors.description && (
                <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.description}
                </p>
              )}
            </>
          ) : (
            <div className="mt-1.5 p-4 bg-zinc-50 rounded-[2rem] border border-black/5">
              <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                {task.description}
              </p>
            </div>
          )}
        </div>

        {/* ── Reward Points (edit only) ── */}
        {isEditing && (
          <div>
            <label className={labelClass}>Reward Points</label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="number"
                min={1}
                value={editState.rewardPoint}
                onChange={(e) =>
                  set("rewardPoint", Math.max(1, Number(e.target.value)))
                }
                className={`w-32 px-4 py-2.5 bg-zinc-50 border rounded-2xl text-sm font-black text-black focus:outline-none transition-all ${
                  errors.rewardPoint
                    ? "border-red-400 focus:border-red-400"
                    : "border-black/5 focus:border-[#FACC15]"
                }`}
              />
              <div className="flex gap-1.5">
                {[5, 10, 20, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("rewardPoint", n)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                      editState.rewardPoint === n
                        ? "bg-[#FACC15] border-[#FACC15] text-black"
                        : "bg-white border-black/10 text-zinc-500 hover:border-[#FACC15]"
                    }`}
                  >
                    {n} pts
                  </button>
                ))}
              </div>
            </div>
            {errors.rewardPoint && (
              <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.rewardPoint}
              </p>
            )}
          </div>
        )}

        {/* ── Comment Instruction ── */}
        {(task.commentInstruction || isEditing) &&
          (isFacebook || isInstagram) && (
            <div>
              <label className={labelClass}>Comment Instruction</label>
              {isEditing ? (
                <textarea
                  value={editState.commentInstruction}
                  onChange={(e) => set("commentInstruction", e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder='e.g. "Comment LOVE2025 below this post"'
                />
              ) : (
                <div className="mt-1.5 p-4 bg-zinc-50 rounded-[2rem] border border-black/5">
                  <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                    {task.commentInstruction}
                  </p>
                </div>
              )}
            </div>
          )}

        {/* ── Linked Post URL ── */}
        {task.socialPostUrl && (
          <div>
            <label className={labelClass}>Linked Post</label>
            {isEditing ? (
              <input
                type="url"
                value={editState.socialPostUrl}
                onChange={(e) => set("socialPostUrl", e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            ) : (
              <a
                href={task.socialPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-2 p-3 bg-blue-50 rounded-[2rem] border border-blue-100 text-sm text-blue-600 font-bold hover:underline"
              >
                ↗ View Post
              </a>
            )}
          </div>
        )}

        {/* ── YouTube Video URL — only shown for YouTube tasks ── */}
        {isYoutube && (task.videoUrl || isEditing) && (
          <div>
            <label className={labelClass}>YouTube Video</label>
            {isEditing ? (
              <>
                <input
                  type="url"
                  value={editState.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  required={needsYoutubeUrl}
                  className={`${inputClass} ${errors.videoUrl ? "border-red-400 focus:border-red-400" : ""}`}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {errors.videoUrl && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.videoUrl}
                  </p>
                )}
              </>
            ) : (
              <a
                href={task.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-2 p-3 bg-red-50 rounded-[2rem] border border-red-100 text-sm text-red-600 font-bold hover:underline"
              >
                ▶ Watch Video
              </a>
            )}
          </div>
        )}

        {/* ── Watch Duration — YouTube watch tasks only ── */}
        {isYoutube && task.taskType === "video_watch" && isEditing && (
          <div>
            <label className={labelClass}>
              Required Watch Duration (seconds)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="number"
                min={10}
                max={3600}
                value={editState.watchDuration}
                onChange={(e) => set("watchDuration", Number(e.target.value))}
                className="w-24 px-4 py-2.5 bg-white border border-red-200 rounded-2xl text-sm font-black text-red-700 focus:outline-none focus:border-red-400 transition-all"
              />
              <div className="flex gap-1.5">
                {[30, 60, 120, 300].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("watchDuration", s)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                      editState.watchDuration === s
                        ? "bg-red-500 border-red-500 text-white"
                        : "bg-white border-red-200 text-red-500 hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    {s >= 60 ? `${s / 60}m` : `${s}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Stats grid ── */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black p-4 rounded-[2rem]">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                Created
              </p>
              <p className="text-white text-sm font-black">{task.created}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-[2rem] border border-emerald-100">
              <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">
                Completions
              </p>
              <p className="text-emerald-900 text-sm font-black">
                {task.completedUsers} users
              </p>
            </div>
          </div>
        )}

        {/* ── Task Type (view) / Toggle (edit) ── */}
        <div>
          <label className={labelClass}>Task Type</label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Permanent */}
              <div
                onClick={() => set("isRecurring", false)}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                  !editState.isRecurring
                    ? "border-[#FACC15] bg-[#FACC15]/5"
                    : "border-black/5 bg-zinc-50 hover:border-black/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-black">
                    🔒 Permanent
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      !editState.isRecurring
                        ? "border-[#FACC15] bg-[#FACC15]"
                        : "border-zinc-300"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">
                  One-time only
                </p>
              </div>
              {/* Daily */}
              <div
                onClick={() => set("isRecurring", true)}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                  editState.isRecurring
                    ? "border-emerald-400 bg-emerald-50/60"
                    : "border-black/5 bg-zinc-50 hover:border-black/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-black">
                    🔄 Daily
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      editState.isRecurring
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-zinc-300"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Resets each midnight
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-1.5">
              {task.isRecurring ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[2rem]">
                  <span className="text-emerald-600">🔄</span>
                  <div>
                    <p className="text-xs font-black text-emerald-800">
                      Daily Refresh
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      Resets at midnight — users can complete once per day
                    </p>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-[2rem]">
                  <span className="text-blue-600">🔒</span>
                  <div>
                    <p className="text-xs font-black text-blue-800">
                      Permanent
                    </p>
                    <p className="text-[10px] text-blue-600 font-medium">
                      One-time only — stays permanently completed
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
