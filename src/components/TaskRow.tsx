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
  const { theme, colors } = useTheme();
  const styles = makeStyles(colors);
  const accent = hueToAccent(task.color, theme === 'dark');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.elevated2 }}
      style={styles.row}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
      <Text style={[styles.streak, { color: accent }]}>
        {task.currentStreak}/{task.targetStreak}
      </Text>
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingLeft: 22,
      paddingRight: 14,
      backgroundColor: c.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      position: 'relative',
      overflow: 'hidden',
    },
    stripe: {
      position: 'absolute',
      left: 0, top: 0, bottom: 0,
      width: 4,
    },
    title: { color: c.textPrimary, flex: 1, fontSize: 15, fontWeight: '600' },
    streak: { fontSize: 14, fontWeight: '700' },
  });
}
