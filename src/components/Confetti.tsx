import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#22c55e', '#f59e0b', '#38bdf8', '#ec4899', '#a855f7', '#facc15', '#ef4444', '#14b8a6'];

interface Props {
  active: boolean;
  count?: number;
}

interface PieceCfg {
  startX: number;
  drift: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotateTo: string;
}

/**
 * Fires a confetti burst on the rising edge of `active`. Reset by toggling
 * `active` back to false and then true again. Pure-JS, native-driver Animated
 * transforms only — safe to use in any platform without new deps.
 */
export function Confetti({ active, count = 44 }: Props) {
  const [runId, setRunId] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) {
      setRunId((r) => r + 1);
    }
    wasActive.current = active;
  }, [active]);

  if (runId === 0) return null;
  return <Burst key={runId} count={count} />;
}

function Burst({ count }: { count: number }) {
  const { width, height } = Dimensions.get('window');
  const particles = useRef<PieceCfg[]>(
    Array.from({ length: count }).map(() => ({
      startX: Math.random() * width,
      drift: (Math.random() - 0.5) * width * 0.5,
      delay: Math.random() * 220,
      duration: 1700 + Math.random() * 1300,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 7 + Math.random() * 7,
      rotateTo: `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`,
    })),
  ).current;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((cfg, i) => (
        <Piece key={i} cfg={cfg} screenH={height} />
      ))}
    </View>
  );
}

function Piece({ cfg, screenH }: { cfg: PieceCfg; screenH: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: cfg.duration,
      delay: cfg.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, cfg.duration, cfg.delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-40, screenH + 80] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.drift] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', cfg.rotateTo] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.82, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: cfg.startX,
          width: cfg.size,
          height: cfg.size * 1.4,
          backgroundColor: cfg.color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
