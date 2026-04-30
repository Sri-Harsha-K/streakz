# Repository Guidelines

## Project Structure & Module Organization
This Expo + React Native app uses TypeScript with strict mode enabled.

- `App.tsx` wires providers, navigation, and global UI hosts.
- `src/screens/` contains route-level screens (`HomeScreen.tsx`, `TaskDetailScreen.tsx`).
- `src/components/` contains reusable UI blocks (cards, modals, heat maps, toasts).
- `src/hooks/useStreakApp.ts` owns core app state, persistence, reminders, and task actions.
- `src/state/` exposes context wrappers around hooks.
- `src/utils/` holds pure logic helpers (date, streak math, color, milestones, reminders).
- `src/theme/` and `src/navigation/` contain styling tokens and navigators.
- `assets/` stores app icons/splash assets; `plugins/with-async-storage-size.js` contains Expo plugin customizations.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run start` starts Expo dev tools.
- `npm run android` launches Expo for Android.
- `npm run ios` launches Expo for iOS.
- `npm run web` launches Expo web target.
- `npx tsc --noEmit` runs a strict TypeScript check (use this before opening a PR).

## Coding Style & Naming Conventions
Use TypeScript-first React Native patterns already present in `src/`.

- 2-space indentation, semicolons, and single quotes.
- Components/screens: `PascalCase` filenames and exports.
- Hooks: `camelCase` prefixed with `use` (example: `useStreakApp`).
- Utility modules: short lowercase names (`date.ts`, `streak.ts`).
- Prefer explicit types on public interfaces and context boundaries.

## Testing Guidelines
There is currently no dedicated Jest/RTL test suite in this repository. Minimum validation for each change:

1. Run `npx tsc --noEmit` with zero errors.
2. Manually verify impacted flows in Expo (at least one platform; multiple for navigation/state changes).
3. For reminder, onboarding, or persistence edits, validate behavior after app reload.

## Commit & Pull Request Guidelines
Git history favors concise subject lines, with occasional conventional prefixes (for example, `feat:`). Follow this style:

- Keep commit subjects short, imperative, and specific.
- Group related code changes per commit; avoid mixed refactors + features.
- PRs should include: summary, risk/rollback notes, manual test steps, and screenshots/video for UI changes.
- Link related issues/tasks when applicable.
