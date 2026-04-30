# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Expo dev server (Metro)
- `npx expo start -c` — start Metro with cache cleared (do this after installing/removing native modules; stale Metro cache causes 500s and missing-module errors)
- `npm run android` / `npm run ios` / `npm run web` — launch on target platform
- `npx tsc --noEmit` — type-check (strict mode, no emit). Treat this as the only correctness gate; no lint or test scripts are configured.
- `npx expo-doctor` — sanity-check SDK alignment after dependency changes (should report 17/17).

Native `ios/` and `android/` folders are gitignored — this is a managed Expo project. New Architecture is enabled (`app.json` → `newArchEnabled: true`); any added native module must support it.

**Expo Go constraint:** the app is developed against Expo Go SDK 54. Do not pull in third-party native modules that aren't bundled in Expo Go (e.g. `@react-native-community/datetimepicker` was tried and removed for this reason). Pure-JS or core Expo modules only, unless the user opts into a dev client build via `npx expo run:android`.

## Architecture

Habit-tracker built on Expo SDK 54 / RN 0.81 / React 19. Entry chain: `index.ts` → `App.tsx` → `SafeAreaProvider` → `ThemeProvider` → `AppDataProvider` → `ConfettiHost` containing `NavRoot`, `<UndoToast />`, and `<NotificationActionHandler />`. Stack nav: `Onboarding` (first launch only) → `Landing` → `Home` → `TaskDetail`, typed via `src/navigation/types.ts`. `NavRoot` waits for `loaded` (AsyncStorage hydration) AND reads `ONBOARDED_KEY` before rendering the navigator, picking `initialRouteName` accordingly. Screens render a "Loading…" placeholder until both resolve.

`App.tsx` calls `configureNotifications()` at module load — this sets the foreground notification handler and is required for scheduled reminders to surface while the app is open.

### Cross-screen swipe navigation

`LandingScreen` and `HomeScreen` use a `PanResponder` for horizontal swipe nav (Landing swipe-left → Home; Home swipe-right → Landing). The shared pattern is `onMoveShouldSetPanResponder = |dx| > 40 && |dx| > 2*|dy|` and a release threshold of 70px with sign-correct velocity. `onStartShouldSetPanResponder` is `false` so taps and vertical scrolls are not stolen. When adding swipe gestures elsewhere, copy this guard exactly — looser thresholds break Pressable taps inside the screen.

### Single source of truth: `useStreakApp` (`src/hooks/useStreakApp.ts`)

All app state lives in this one hook, exposed app-wide through `AppDataContext`. There is no Redux/Zustand layer — components consume `useAppData()`.

- Persistence: full `AppState` (`{ tasks, completions }`) JSON-serialized into AsyncStorage under key `streakapp_v1`.
- **Load-then-save invariant**: a `loadedRef` guards the persist effect so the first render does not overwrite disk with `EMPTY`. Preserve this guard when refactoring the hook.
- `migrateTask` runs on every load and is the migration seam for legacy fields (e.g. `color` was previously a string name; `migrateColor` in `src/utils/color.ts` handles old shapes). Add new optional fields with defaults here, never mutate stored shape directly.
- A 60s `setInterval` runs `checkAndResetStreak` on every task to zero out streaks when a day was missed, even while the app stays open.
- IDs come from `expo-crypto`'s `randomUUID()`.
- Hard cap: `MAX_ACTIVE_TASKS = 20` is enforced inside `createTask` (rejects silently if over). UI defense: the `+` button is disabled at cap. Cap counts unarchived tasks only.
- Hook also owns transient UI state used by global components: `recentCompletion` + `dismissRecentCompletion` drive `UndoToast`. Set inside `markComplete`, auto-cleared after `UNDO_WINDOW_MS` (10s) via `armUndoTimer`. `undoTodayCompletion` removes today's completion entry, then recomputes `currentStreak` and `lastCompletedDate` from the remaining log via `computeStreakAtDate`. `longestStreak` is intentionally NOT decremented on undo.
- `extendTarget` and `updateTask({ targetStreak })` overlap. `updateTask` is the preferred path for new code — it handles reminder/title diff and resets `milestoneAcknowledged`. `extendTarget` may be removed in a future cleanup PR; check before adding new call sites.

### AsyncStorage keys

- `streakapp_v1` — full persisted `AppState`
- `streakapp_theme` — `'dark' | 'light'` user override (managed by `ThemeProvider`)
- `streakapp_sort` — sort mode for HomeScreen (`'created' | 'streak' | 'alpha' | 'recent'`, managed locally in HomeScreen)
- `streakapp_onboarded` — set to `'1'` after onboarding completes (read by `NavRoot` to pick initial route). Exported as `ONBOARDED_KEY` from `OnboardingScreen.tsx`.
- `streakapp_name` — optional user name captured on the 4th onboarding slide. Read by `LandingScreen` on focus to greet the user. Exported as `USER_NAME_KEY` from `OnboardingScreen.tsx`.

When wiping data (the long-press-on-title gesture, or `clearAll` in the hook), `streakapp_v1` is cleared and all scheduled reminders are cancelled, but theme/sort/onboarded/name prefs are intentionally left intact. To force-replay onboarding for QA, clear both `streakapp_onboarded` and `streakapp_name` and `navigation.replace('Onboarding')` (a temporary dev-only Pressable on `LandingScreen` does this — remove before shipping).

### Streak semantics (`src/utils/streak.ts` + `src/utils/date.ts`)

- Dates are **local** `YYYY-MM-DD` strings produced by `toLocalDateString`. Never use ISO/UTC for date comparisons — `daysBetween` parses local components.
- **Streak freeze is fixed at 1 day** (`GRACE_DAYS = 1`, `MAX_GAP = 2`). One missed day in a row preserves the streak ("frozen"); two in a row resets to 0. This is intentionally non-configurable per task — do not add a UI toggle for it.
- `computeUpdatedStreak` is idempotent for same-day calls and bumps `currentStreak` when the gap to the previous completion is `<= MAX_GAP`. `markComplete` early-exits if today is already completed.
- `checkAndResetStreak` (called by the 60s interval and on load) zeroes `currentStreak` only when `daysBetween(lastCompletedDate, today) > MAX_GAP`.
- `isTaskFrozen(task)` returns true when the streak is alive but today is unticked and the gap to the last completion is exactly 2 (i.e. today is the deadline). Used by `LandingScreen` to render the ❄ Frozen badge in Today's habits, and by the freeze-reminder scheduler.
- `computeStreakAtDate` recomputes historical streaks from the completions log — used by HeatMap, TaskDetail, and `undoTodayCompletion`. Treat the completions array as the immutable source of truth; `task.currentStreak` is a denormalized cache.

### Reminder / notification subsystem (`src/utils/reminders.ts`)

Local daily reminders backed by `expo-notifications`. Scheduling is fire-and-forget from the hook actions; the resulting notification id(s) are patched back onto the task via a follow-up `setState`.

- `scheduleDailyReminder(taskId, title, hour, minute)` uses the `DAILY` calendar trigger and registers an Android channel `habit-reminders` lazily on first call. Returns `null` on failure (e.g. permission denied) — callers must handle `null`.
- `Task.reminderTime` (`'HH:MM'` 24h, or `null`) is the source of truth users edit. `Task.reminderNotifId` is bookkeeping for cancellation; never present it in UI.
- **Daily reminder lifecycle:** `createTask` / `unarchiveTask` / `importData` schedule, `archiveTask` / `deleteTask` / `clearAll` cancel, `updateTask` diffs old vs new and reschedules when `reminderTime` or (with reminder set) `title` changes. Preserve cancel-then-reschedule order to avoid orphan notifications when extending these.
- `importData` always strips inbound `reminderNotifId` and `freezeNotifIds` (stale on a new device) and reschedules from `reminderTime`, after `cancelAllReminders()`.
- **Freeze reminders:** `scheduleFreezeReminders(taskId, title)` schedules a series of one-shot DATE-trigger notifications when a task transitions into the frozen state. Cadence ramps as the day ends — every 2h before 5pm local, every 1h between 5–8pm, every 30min after 8pm, last fire at 11:30pm local. The resulting ids are stored on `Task.freezeNotifIds: string[]`. A `useEffect` in `useStreakApp` watching `state.tasks` calls `ensureFreezeReminders` / `clearFreezeRemindersFor` on rising/falling edges of `isTaskFrozen`. When the user marks the frozen task complete (or it expires) the array must be cleared and each id cancelled — `markComplete`, `archiveTask`, `deleteTask`, and `clearAll` all do this. `cancelAllReminders()` covers the catch-all paths (`importData`, full wipe).
- Notification action button "Mark done" on daily reminders uses category `STREAK_REMINDER` with `opensAppToForeground: false` and is handled by `<NotificationActionHandler />` mounted at the root inside `AppDataProvider`. The handler subscribes to `addNotificationResponseReceivedListener` and also calls `getLastNotificationResponseAsync` once on mount to catch responses that fired while the app was killed. Both call `markComplete(taskId)` from context.
- Expo Go SDK 53+ logs an ERROR about remote push at app start. This is benign — local schedules still fire. Don't try to silence it; building a dev client would.

### Color system (`src/utils/color.ts`)

Task accent colors are stored as a **hue number 0–359**, not a hex string. UI derives all variants (accent, dim, badge bg/text, heatmap levels 1–4) via `hueTo*` helpers using HSL. When building task-themed UI, prefer these helpers over hard-coded colors so accents stay consistent across light/dark theme.

### Theme (`src/theme/`)

Two themes (`DARK`, `LIGHT`) selected via `ThemeProvider`. Initial value comes from `Appearance.getColorScheme()`, then overridden by AsyncStorage key `streakapp_theme`. Components must read colors from `useTheme().colors` and build `StyleSheet`s inside the component (pattern: `const styles = makeStyles(colors)`) — the theme can switch at runtime, so module-level `StyleSheet.create` with hard-coded colors will not re-render.

### Milestones (`src/utils/milestones.ts`)

`getNextMilestones(target)` returns two suggested next-step targets, table-driven for common values and falling back to `1.5×` / `2×` rounded to 5. `task.milestoneAcknowledged` is reset whenever the target changes (handled by `updateTask` and `extendTarget`) or current streak drops below it. `MilestoneModal` is rendered as an in-screen absolute overlay (NOT a native RN `Modal`) — this is intentional so the root-level `UndoToast` paints above it. If you ever switch it back to native `Modal`, the undo affordance disappears behind it.

### Overlay layering

Three overlays render at the root in `App.tsx`, stacked above `NavRoot`:
- `ConfettiHost` — wraps the whole tree and exposes `useConfetti().fire()`. Confetti is rendered at the root by the host so it paints above every screen and overlay. `MilestoneModal` calls `fire()` on the rising edge of `(visible && celebrate)`. Use this hook for any future celebration animation; do not mount a `Confetti` component inside a screen — it will be obscured by the milestone dialog (or any other overlay).
- `UndoToast` — absolute-positioned `Animated.View` near the bottom safe area. Reads `recentCompletion` from context; tap `Undo` calls `undoTodayCompletion`.
- `NotificationActionHandler` — non-rendering component; mounts notification listeners (see Reminder subsystem).
- (`MilestoneModal` is mounted from inside `TaskDetailScreen` but renders as an absolute fill, not a native modal — see Milestones above.)

When introducing new modals, prefer the in-screen overlay pattern (`Animated.View` + `StyleSheet.absoluteFillObject` + manual backdrop `Pressable`) so root-level overlays continue to layer correctly. Native `Modal` from `react-native` punches up to its own native window and will hide root overlays (confetti, undo toast).

### Types

Domain types are centralized in `src/types/index.ts` (`Task`, `Completion`, `AppState`, `HeatMapCell`). Adding a field to `Task` requires:
1. Updating the interface.
2. Defaulting it in `migrateTask` (handle the case where it's missing on disk).
3. Defaulting it in `createTask`.
4. If it affects reminders or any external resource: handle it in `updateTask`, `archiveTask`, `unarchiveTask`, `deleteTask`, `clearAll`, and `importData` (which strips and re-derives external state).
