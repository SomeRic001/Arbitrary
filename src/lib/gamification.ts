export function getUserTier(completedTasksCount: number): string {
  if (completedTasksCount >= 50) return "Arbitrary Elite";
  if (completedTasksCount >= 25) return "Gold";
  if (completedTasksCount >= 10) return "Silver";
  return "Bronze";
}

// Monthly point thresholds to reach each tier this month.
// This is the canonical tier calculation shown in the Dashboard
// "Monthly Milestone" tracker and should be reused anywhere a
// points-based tier needs to be displayed (e.g. the leaderboard).
export const TIER_THRESHOLDS: Record<string, number> = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  "Arbitrary Elite": 600,
};

export const TIER_ORDER = ["Bronze", "Silver", "Gold", "Arbitrary Elite"];

export function getCurrentMonthlyTier(pts: number): string {
  if (pts >= 600) return "Arbitrary Elite";
  if (pts >= 300) return "Gold";
  if (pts >= 100) return "Silver";
  return "Bronze";
}

export function getNextTier(
  pts: number,
): { name: string; threshold: number } | null {
  const currentTier = getCurrentMonthlyTier(pts);
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  const name = TIER_ORDER[idx + 1];
  return { name, threshold: TIER_THRESHOLDS[name] };
}

export function getPrevThreshold(pts: number): number {
  const currentTier = getCurrentMonthlyTier(pts);
  return TIER_THRESHOLDS[currentTier] ?? 0;
}

// Maps the canonical tier label (Bronze/Silver/Gold/Arbitrary Elite) to the
// lowercase key used by TIER_META in the leaderboard UI.
export function getTierKey(tierLabel: string): string {
  switch (tierLabel) {
    case "Silver":
      return "silver";
    case "Gold":
      return "gold";
    case "Arbitrary Elite":
      return "elite";
    default:
      return "bronze";
  }
}

export function getStreakMultiplier(currentStreak: number): number {
  if (currentStreak >= 30) return 1.5;
  if (currentStreak >= 7) return 1.2;
  return 1.0;
}