import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Task, Completion } from '../types';
import { hueToAccent, hueToAccentBg, hueToAccentBorder, hueToAccentBadgeText } from '../utils/color';
import { isTodayCompleted } from '../utils/streak';
import { getNextMilestones } from '../utils/milestones';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { HeatMap } from './HeatMap';

interface Props {
  task: Task;
  completions: Completion[];
  onMarkComplete: (taskId: string) => void;
  onExtend: (taskId: string, newTarget: number) => void;
  onArchive: (taskId: string) => void;
}

export function TaskCard({ task, completions, onMarkComplete, onExtend, onArchive }: Props) {
  const { theme, colors } = useTheme();
  const styles = makeStyles(colors);

  const accent = hueToAccent(task.color);
  const accentBg = hueToAccentBg(task.color);
  const accentBorder = hueToAccentBorder(task.color);
  const accentBadgeText = hueToAccentBadgeText(task.color);

  // Light mode: keep accent visible for "done" state — dark accentBg is unreadable on light card
  const doneBg = theme === 'light' ? accent : accentBg;
  const doneBorder = theme === 'light' ? accent : accentBorder;
  const doneText = theme === 'light' ? '#030712' : accentBadgeText;

  const done = isTodayCompleted(task.id, completions);
  const targetReached = task.currentStreak >= task.targetStreak;
  const [opt1, opt2] = getNextMilestones(task.targetStreak);

  return (
    <View style={[styles.card, { borderColor: accentBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: accent }]}>{task.title}</Text>
          {!!task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}
        </View>
        <View
          style={[
            styles.badge,
            theme === 'light'
              ? { backgroundColor: accent, borderColor: accent }
              : { backgroundColor: accentBg, borderColor: accentBorder },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: theme === 'light' ? '#030712' : accentBadgeText },
            ]}
          >
            {task.currentStreak}/{task.targetStreak}d
          </Text>
        </View>
      </View>

      <Text style={styles.subtle}>
        Longest: {task.longestStreak}d · Created {task.createdAt.slice(0, 10)}
      </Text>

      <View style={styles.heatWrap}>
        <HeatMap task={task} completions={completions} />
      </View>

      {targetReached ? (
        <View style={styles.milestoneBox}>
          <Text style={styles.milestoneTitle}>{task.targetStreak}-day target hit</Text>
          <Text style={styles.subtle}>Extend or archive?</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, { backgroundColor: accent }]}
              onPress={() => onExtend(task.id, opt1)}
            >
              <Text style={styles.btnAccentText}>→ {opt1}d</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: accent }]}
              onPress={() => onExtend(task.id, opt2)}
            >
              <Text style={styles.btnAccentText}>→ {opt2}d</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={() => onArchive(task.id)}>
              <Text style={styles.btnText}>Archive</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[
            styles.completeBtn,
            done
              ? { backgroundColor: doneBg, borderColor: doneBorder, opacity: theme === 'light' ? 0.85 : 1 }
              : { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => onMarkComplete(task.id)}
          disabled={done}
        >
          <Text
            style={[
              styles.completeText,
              { color: done ? doneText : '#030712' },
            ]}
          >
            {done ? '✓ Done today' : 'Mark complete'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    headerLeft: { flex: 1 },
    title: { fontSize: 17, fontWeight: '600' },
    description: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    subtle: { color: c.textFaint, fontSize: 11, marginTop: 4 },
    heatWrap: { marginTop: 12 },
    milestoneBox: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
    },
    milestoneTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
    btn: {
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    btnGhost: {
      backgroundColor: c.elevated2,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    btnText: { color: c.textPrimary, fontSize: 13 },
    btnAccentText: { color: '#030712', fontSize: 13, fontWeight: '600' },
    completeBtn: {
      marginTop: 12,
      paddingVertical: 11,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
    },
    completeText: { fontSize: 14, fontWeight: '600' },
  });
}
