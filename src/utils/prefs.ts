import AsyncStorage from '@react-native-async-storage/async-storage';

export const REMINDERS_ENABLED_KEY = 'streakapp_reminders_enabled';
export const FREEZE_ENABLED_KEY = 'streakapp_freeze_warnings';

export interface NotificationPrefs {
  remindersEnabled: boolean;
  freezeWarningsEnabled: boolean;
}

// Default-on; only the literal '0' disables. Mirrors how SettingsScreen wrote
// these keys before they became real.
const cache: NotificationPrefs = {
  remindersEnabled: true,
  freezeWarningsEnabled: true,
};

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

type Listener = (prefs: NotificationPrefs) => void;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l({ ...cache });
}

export async function hydratePrefs(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const [r, f] = await AsyncStorage.multiGet([REMINDERS_ENABLED_KEY, FREEZE_ENABLED_KEY]);
      cache.remindersEnabled = r[1] !== '0';
      cache.freezeWarningsEnabled = f[1] !== '0';
    } catch {
      // keep defaults on failure
    }
    hydrated = true;
  })();
  return hydratePromise;
}

export function getPrefsSync(): NotificationPrefs {
  return { ...cache };
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  cache.remindersEnabled = enabled;
  hydrated = true;
  notify();
  try {
    await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    // best-effort persist; in-memory state still updated
  }
}

export async function setFreezeWarningsEnabled(enabled: boolean): Promise<void> {
  cache.freezeWarningsEnabled = enabled;
  hydrated = true;
  notify();
  try {
    await AsyncStorage.setItem(FREEZE_ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    // best-effort persist; in-memory state still updated
  }
}

export function subscribePrefs(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
