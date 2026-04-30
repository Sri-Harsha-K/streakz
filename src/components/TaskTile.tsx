import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';
import { hueToAccent } from '../utils/color';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface Props {
  task: Task;
  onPress: () => void;
  onLongPress?: () => void;
}

export function TaskTile({ task, onPress, onLongPress }: Props) {
  const { theme, colors } = useTheme();
  const styles = makeStyles(colors);

  const accent = hueToAccent(task.color, theme === 'dark');
  const pct = Math.min(100, Math.round((task.currentStreak / task.targetStreak) * 100));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.elevated2 }}
      style={styles.tile}
    >
      <View style={styles.headerRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{task.currentStreak}/{task.targetStreak}d</Text>
        <Text style={styles.metaText}>{pct}%</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: 0,
      backgroundColor: c.card,
      borderRadius: 14,
      paddingTop: 14,
      paddingBottom: 12,
      paddingHorizontal: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      gap: 8,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    title: { color: c.textPrimary, fontSize: 15, fontWeight: '700', flex: 1, minWidth: 0 },
    barTrack: {
      height: 4,
      backgroundColor: c.divider,
      borderRadius: 2,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 2 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    metaText: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
  });
}
