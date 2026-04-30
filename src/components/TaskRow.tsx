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

export function TaskRow({ task, onPress, onLongPress }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const accent = hueToAccent(task.color);
  const pct = Math.min(100, Math.round((task.currentStreak / task.targetStreak) * 100));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.elevated2 }}
      style={styles.row}
    >
      <View style={[styles.swatch, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
        </View>
      </View>
      <Text style={[styles.streak, { color: accent }]}>
        {task.currentStreak}<Text style={styles.streakMuted}>/{task.targetStreak}</Text>
      </Text>
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: c.card,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 5,
      elevation: 2,
    },
    swatch: { width: 8, height: 32, borderRadius: 4 },
    body: { flex: 1, gap: 6 },
    title: { fontSize: 14, fontWeight: '600' },
    barTrack: {
      height: 4,
      backgroundColor: c.elevated2,
      borderRadius: 2,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 2 },
    streak: { fontSize: 14, fontWeight: '700', minWidth: 56, textAlign: 'right' },
    streakMuted: { color: c.textFaint, fontSize: 11, fontWeight: '500' },
  });
}
