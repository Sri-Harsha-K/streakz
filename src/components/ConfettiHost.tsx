import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Confetti } from './Confetti';

interface ConfettiCtx {
  fire: () => void;
}

const Ctx = createContext<ConfettiCtx | null>(null);

/**
 * Mounts a single Confetti instance at the very end of its children, so the
 * particle layer paints above every other view in the tree (modals, toasts,
 * navigation). Children can trigger a burst via `useConfetti().fire()`.
 */
export function ConfettiHost({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  const fire = useCallback(() => {
    // Flip back to false first so Confetti's rising-edge detector triggers
    // a fresh runId even if a previous burst is still mid-flight.
    setActive(false);
    requestAnimationFrame(() => setActive(true));
  }, []);

  return (
    <Ctx.Provider value={{ fire }}>
      <View style={styles.root}>
        {children}
        <Confetti active={active} />
      </View>
    </Ctx.Provider>
  );
}

export function useConfetti(): ConfettiCtx {
  const c = useContext(Ctx);
  if (!c) {
    // Fail soft so unrelated callers (e.g. tests) don't crash; just no-op.
    return { fire: () => {} };
  }
  return c;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
