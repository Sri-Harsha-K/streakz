# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Expo dev server (Metro)
- `npm run android` / `npm run ios` / `npm run web` — launch on target platform
- `npx tsc --noEmit` — type-check (strict mode, no emit). No lint or test scripts are configured.

Native `ios/` and `android/` folders are gitignored — this is a managed Expo project. New Architecture is enabled (`app.json` → `newArchEnabled: true`); any added native module must support it.

## Architecture

Habit-tracker built on Expo SDK 54 / RN 0.81 / React 19. Entry chain: `index.ts` → `App.tsx` → `SafeAreaProvider` → `ThemeProvider` → `AppDataProvider` → `NavRoot`. Stack nav: `Landing` → `Home` → `TaskDetail` (typed via `src/navigation/types.ts`).

### Single source of truth: `useStreakApp` (`src/hooks/useStreakApp.ts`)

All app state lives in this one hook, exposed app-wide through `AppDataContext`. There is no Redux/Zustand layer — components consume `useAppData()`.

- Persistence: full `AppState` (`{ tasks, completions }`) JSON-serialized into AsyncStorage under key `streakapp_v1`.
- **Load-then-save invariant**: a `loadedRef` guards the persist effect so the first render does not overwrite disk with `EMPTY`. Preserve this guard when refactoring the hook.
- `migrateTask` runs on every load and is the migration seam for legacy fields (e.g. `color` was previously a string name; `migrateColor` in `src/utils/color.ts` handles old shapes). Add new optional fields with defaults here, never mutate stored shape directly.
- A 60s `setInterval` runs `checkAndResetStreak` on every task to zero out streaks when a day was missed, even while the app stays open.
- IDs come from `expo-crypto`'s `randomUUID()`.

### Streak semantics (`src/utils/streak.ts` + `src/utils/date.ts`)

- Dates are **local** `YYYY-MM-DD` strings produced by `toLocalDateString`. Never use ISO/UTC for date comparisons — `daysBetween` parses local components.
- `computeUpdatedStreak` is idempotent for same-day calls and bumps `currentStreak` only when the previous completion was yesterday (gap === 1). `markComplete` early-exits if today is already completed.
- `computeStreakAtDate` recomputes historical streaks from the completions log — used by HeatMap/TaskDetail. Treat the completions array as the immutable source of truth; `task.currentStreak` is a denormalized cache.

### Color system (`src/utils/color.ts`)

Task accent colors are stored as a **hue number 0–359**, not a hex string. UI derives all variants (accent, dim, badge bg/text, heatmap levels 1–4) via `hueTo*` helpers using HSL. When building task-themed UI, prefer these helpers over hard-coded colors so accents stay consistent across light/dark theme.

### Theme (`src/theme/`)

Two themes (`DARK`, `LIGHT`) selected via `ThemeProvider`. Initial value comes from `Appearance.getColorScheme()`, then overridden by AsyncStorage key `streakapp_theme`. Components must read colors from `useTheme().colors` and build `StyleSheet`s inside the component (pattern: `const styles = makeStyles(colors)`) — the theme can switch at runtime, so module-level `StyleSheet.create` with hard-coded colors will not re-render.

### Milestones (`src/utils/milestones.ts`)

`getNextMilestones(target)` returns two suggested next-step targets, table-driven for common values and falling back to `1.5×` / `2×` rounded to 5. `task.milestoneAcknowledged` is reset whenever the target changes or current streak drops below it — preserve this when adding milestone-related flows.

### Types

Domain types are centralized in `src/types/index.ts` (`Task`, `Completion`, `AppState`, `HeatMapCell`). Adding a field to `Task` requires: (1) updating the interface, (2) defaulting it in `migrateTask`, (3) defaulting it in `createTask`.
