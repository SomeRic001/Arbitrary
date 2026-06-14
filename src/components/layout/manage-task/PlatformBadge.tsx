import { PLATFORMS } from "@/src/lib/manage-task/types";

type Props = {
  platform?: string | null;
};

const EXTRA_PLATFORMS: Record<string, { color: string; label: string }> = {
  share: { color: "#10b981", label: "Share" },
  screenshot: { color: "#6366f1", label: "Screenshot" },
};

export function PlatformBadge({ platform }: Props) {
  if (!platform) {
    return (
      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500">
        Manual
      </span>
    );
  }

  const match = PLATFORMS.find((p) => p.value === platform);
  const extra = EXTRA_PLATFORMS[platform];
  const color = match?.color ?? extra?.color ?? "#6b7280";
  const label = match?.label ?? extra?.label ?? platform.toUpperCase();

  return (
    <span
      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
