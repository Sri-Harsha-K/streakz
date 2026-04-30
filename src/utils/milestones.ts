/**
 * Milestone progression framework.
 *
 * Each entry maps a target → two suggested next targets.
 * Selection logic: pick explicit entry, else compute 1.5× and 2× rounded to nearest 5.
 *
 * Philosophy: steps grow with momentum — early targets cluster near 30d, later ones
 * jump toward annual milestones. Every step is ≥ 5 days beyond the current target.
 */
const MILESTONE_MAP: Record<number, [number, number]> = {
  3:   [7,   14],
  5:   [10,  14],
  7:   [14,  21],
  10:  [14,  21],
  14:  [21,  30],
  21:  [30,  45],
  30:  [45,  60],
  45:  [60,  90],
  60:  [90,  120],
  75:  [100, 150],
  90:  [120, 180],
  100: [150, 200],
  120: [180, 240],
  150: [200, 300],
  180: [270, 365],
  200: [300, 365],
  240: [300, 365],
  270: [365, 500],
  300: [365, 500],
  365: [500, 730],
  500: [730, 1000],
  730: [1000, 1461],
};

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

/**
 * Returns two suggested next milestones for a given target.
 * Both are strictly greater than `target`.
 */
export function getNextMilestones(target: number): [number, number] {
  const mapped = MILESTONE_MAP[target];
  if (mapped) return mapped;

  const opt1 = Math.max(roundTo5(target * 1.5), target + 5);
  const opt2 = Math.max(roundTo5(target * 2), opt1 + 5);
  return [opt1, opt2];
}

/** Common preset values for the creation form. */
export const TARGET_PRESETS = [7, 14, 21, 30, 60, 90, 180, 365] as const;
