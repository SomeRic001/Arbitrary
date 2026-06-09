export function isDailyTaskValid(
  taskType: string | null,
  referenceDate: Date | string | null,
): boolean {
  if (taskType !== "daily") return true;
  if (!referenceDate) return false;
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const ref = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;
  return ref >= todayStart;
}
