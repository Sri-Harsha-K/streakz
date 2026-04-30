import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';
import { hueToAccent, hueToAccentBg, hueToAccentBorder } from '../utils/color';
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

  const accent = hueToAccent(task.color);
  const accentBg = hueToAccentBg(task.color);
  const accentBorder = hueToAccentBorder(task.color);

  const pct = Math.min(100, Math.round((task.currentStreak / task.targetStreak) * 100));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: accentBg }}
      style={[
        styles.tile,
        { borderColor: theme === 'light' ? accent : accentBorder },
      ]}
    >
      <View style={styles.dot} >
        <View style={[styles.dotInner, { backgroundColor: accent }]} />
      </View>
      <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
        {task.title}
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaPrimary}>{task.currentStreak}<Text style={styles.metaMuted}>/{task.targetStreak}d</Text></Text>
        <Text style={styles.metaMuted}>{pct}%</Text>
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
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    dot: {
      width: 12, height: 12, marginBottom: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    dotInner: { width: 10, height: 10, borderRadius: 5 },
    title: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    desc: { color: c.textFaint, fontSize: 11, marginBottom: 8 },
    barTrack: {
      height: 6,
      backgroundColor: c.elevated2,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 6,
      marginBottom: 8,
    },
    barFill: { height: '100%', borderRadius: 3 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    metaPrimary: { color: c.textPrimary, fontSize: 13, fontWeight: '600' },
    metaMuted: { color: c.textFaint, fontSize: 11, fontWeight: '500' },
  });
}
