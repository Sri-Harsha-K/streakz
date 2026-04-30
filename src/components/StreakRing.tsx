import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  value: number;
  target: number;
  color: string;
  size?: number;
}

export function StreakRing({ value, target, color, size = 56 }: Props) {
  const { colors } = useTheme();
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(target, 1), 1);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.divider}
          strokeWidth={3}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.target, { color: colors.textFaint }]}>/{target}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '600', lineHeight: 20 },
  target: { fontSize: 9, fontWeight: '500', marginTop: 2 },
});
