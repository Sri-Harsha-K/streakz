// Shared notification identifiers. Kept in their own module so both the
// foreground reminder code and the background TaskManager task can import
// them without forming a cycle.
export const STREAK_CATEGORY_ID = 'STREAK_REMINDER';
export const ACTION_MARK_DONE = 'MARK_DONE';
