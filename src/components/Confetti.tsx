import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#22c55e', '#f59e0b', '#38bdf8', '#ec4899', '#a855f7', '#facc15', '#ef4444', '#14b8a6'];

interface Props {
  active: boolean;
  count?: number;
}

interface PieceCfg {
  side: 'left' | 'right';
  angleDeg: number;
  v0: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotateTo: string;
}

const GRAVITY = 1400;
const KEYFRAMES = 16;

export function Confetti({ active, count = 60 }: Props) {
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
  const half = Math.floor(count / 2);
  const particles = useRef<PieceCfg[]>(
    Array.from({ length: count }).map((_, i) => {
      const side: 'left' | 'right' = i < half ? 'left' : 'right';
      const base = side === 'left' ? 70 : 110;
      const jitter = (Math.random() - 0.5) * 24;
      return {
        side,
        angleDeg: base + jitter,
        v0: 900 + Math.random() * 700,
        delay: Math.random() * 180,
        duration: 1800 + Math.random() * 1200,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 7 + Math.random() * 7,
        rotateTo: `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`,
      };
    }),
  ).current;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((cfg, i) => (
        <Piece key={i} cfg={cfg} screenW={width} screenH={height} />
      ))}
    </View>
  );
}

function Piece({ cfg, screenW, screenH }: { cfg: PieceCfg; screenW: number; screenH: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: cfg.duration,
      delay: cfg.delay,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress, cfg.duration, cfg.delay]);

  const T = cfg.duration / 1000;
  const rad = (cfg.angleDeg * Math.PI) / 180;
  const vx = cfg.v0 * Math.cos(rad);
  const vy = -cfg.v0 * Math.sin(rad);

  const inputRange: number[] = [];
  const xRange: number[] = [];
  const yRange: number[] = [];
  for (let i = 0; i <= KEYFRAMES; i++) {
    const p = i / KEYFRAMES;
    const t = p * T;
    inputRange.push(p);
    xRange.push(vx * t);
    yRange.push(vy * t + 0.5 * GRAVITY * t * t);
  }

  const translateX = progress.interpolate({ inputRange, outputRange: xRange });
  const translateY = progress.interpolate({ inputRange, outputRange: yRange });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', cfg.rotateTo] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.05, 0.45, 1],
    outputRange: [0, 1, 1, 0],
  });

  const left = cfg.side === 'left' ? -8 : screenW - 8;
  const top = screenH - 16;

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left,
          top,
          width: cfg.size,
          height: cfg.size * 1.4,
          backgroundColor: cfg.color,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
