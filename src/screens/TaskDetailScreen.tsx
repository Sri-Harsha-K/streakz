import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { hueToAccent, hueToAccentBg, hueToAccentBorder, hueToAccentBadgeText } from '../utils/color';
import { isTodayCompleted, computeStreakAtDate } from '../utils/streak';
import { getNextMilestones } from '../utils/milestones';
import { formatDisplayDate, today, daysBetween } from '../utils/date';
import { HeatMap } from '../components/HeatMap';
import { MilestoneModal } from '../components/MilestoneModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const { theme, colors } = useTheme();
  const { tasks, allTasks, completions, markComplete, extendTarget, archiveTask, unarchiveTask, acknowledgeMilestone, updateTask } = useAppData();
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const task = allTasks.find(t => t.id === taskId);

  useEffect(() => {
    if (!task) navigation.goBack();
  }, [task, navigation]);

  const targetReachedNow = task ? task.currentStreak >= task.targetStreak : false;
  const shouldShowMilestone = !!task && targetReachedNow && !task.archived && !task.milestoneAcknowledged;

  useEffect(() => {
    if (shouldShowMilestone) setMilestoneOpen(true);
  }, [shouldShowMilestone]);

  useEffect(() => {
    if (!targetReachedNow) setMilestoneOpen(false);
  }, [targetReachedNow]);

  const styles = makeStyles(colors);

  if (!task) return null;

  const accent = hueToAccent(task.color);
  const accentBg = hueToAccentBg(task.color);
  const accentBorder = hueToAccentBorder(task.color);
  const accentBadgeText = hueToAccentBadgeText(task.color);

  const doneBg = theme === 'light' ? accent : accentBg;
  const doneBorder = theme === 'light' ? accent : accentBorder;
  const doneText = theme === 'light' ? '#030712' : accentBadgeText;

  const done = isTodayCompleted(task.id, completions);
  const targetReached = task.currentStreak >= task.targetStreak;
  const [opt1, opt2] = getNextMilestones(task.targetStreak);

  const taskCompletions = completions.filter(c => c.taskId === task.id);
  const totalCompletions = taskCompletions.length;
  const ageDays = task.lastCompletedDate
    ? daysBetween(task.createdAt.slice(0, 10), today())
    : daysBetween(task.createdAt.slice(0, 10), today());
  const completionRate = ageDays > 0 ? Math.round((totalCompletions / (ageDays + 1)) * 100) : 0;
  const lastDone = task.lastCompletedDate ? formatDisplayDate(task.lastCompletedDate) : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerActions}>
          {!task.archived && (
            <Pressable onPress={() => setEditOpen(true)} hitSlop={8}>
              <Text style={styles.actionLink}>Edit</Text>
            </Pressable>
          )}
          {task.archived ? (
            <Pressable onPress={() => unarchiveTask(task.id)} hitSlop={8}>
              <Text style={[styles.actionLink, { color: accent }]}>Unarchive</Text>
            </Pressable>
          ) : targetReached ? (
            <Pressable onPress={() => archiveTask(task.id)} hitSlop={8}>
              <Text style={styles.actionLink}>Archive</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.titleBlock}>
        <View style={[styles.colorDot, { backgroundColor: accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: accent }]}>{task.title}</Text>
        </View>
      </View>

      {!!task.description && (
        <>
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={[styles.section, { borderColor: colors.borderSubtle }]}>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </View>
        </>
      )}

      <View style={styles.statsGrid}>
        <Stat colors={colors} label="Current" value={`${task.currentStreak}d`} accent={accent} />
        <Stat colors={colors} label="Longest" value={`${task.longestStreak}d`} />
        <Stat colors={colors} label="Target" value={`${task.targetStreak}d`} />
        <Stat colors={colors} label="Total done" value={`${totalCompletions}`} />
        <Stat colors={colors} label="Rate" value={`${completionRate}%`} />
        <Stat colors={colors} label="Last done" value={lastDone} small />
      </View>

      <Text style={styles.sectionLabel}>Progress</Text>
      <View style={[styles.section, { borderColor: colors.borderSubtle }]}>
        <HeatMap task={task} completions={completions} />
      </View>

      {!task.archived ? (
        <Pressable
          style={[
            styles.completeBtn,
            done
              ? { backgroundColor: doneBg, borderColor: doneBorder, opacity: theme === 'light' ? 0.85 : 1 }
              : { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => markComplete(task.id)}
          disabled={done}
        >
          <Text style={[styles.completeText, { color: done ? doneText : '#030712' }]}>
            {done ? '✓ Done today' : 'Mark complete'}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.section, { borderColor: colors.borderSubtle }]}>
          <Text style={[styles.muted, { textAlign: 'center' }]}>This habit is archived.</Text>
        </View>
      )}

      {targetReached && !task.archived && task.milestoneAcknowledged && (
        <Pressable
          style={[styles.reopenBtn, { borderColor: accentBorder }]}
          onPress={() => setMilestoneOpen(true)}
        >
          <Text style={[styles.reopenText, { color: accent }]}>
            ★ {task.targetStreak}d hit — extend or archive
          </Text>
        </Pressable>
      )}

      <EditTaskModal
        visible={editOpen}
        task={task}
        onClose={() => setEditOpen(false)}
        onSave={(patch) => updateTask(task.id, patch)}
      />

      <MilestoneModal
        visible={milestoneOpen}
        hue={task.color}
        currentTarget={task.targetStreak}
        celebrate={shouldShowMilestone}
        onExtend={(newTarget) => {
          extendTarget(task.id, newTarget);
          setMilestoneOpen(false);
        }}
        onArchive={() => {
          archiveTask(task.id);
          setMilestoneOpen(false);
        }}
        onDismiss={() => {
          acknowledgeMilestone(task.id);
          setMilestoneOpen(false);
        }}
      />
    </ScrollView>
  );
}

function Stat({
  colors,
  label,
  value,
  accent,
  small,
}: {
  colors: ThemeColors;
  label: string;
  value: string;
  accent?: string;
  small?: boolean;
}) {
  return (
    <View style={[
      {
        flex: 1,
        minWidth: '30%',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 10,
        padding: 12,
      },
    ]}>
      <Text style={{ color: colors.textFaint, fontSize: 11, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: accent ?? colors.textPrimary, fontSize: small ? 13 : 18, fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}

// transparent-ish accent fallback for light-mode milestone box bg
function c0(accent: string): string {
  return accent.replace('hsl(', 'hsla(').replace(')', ', 0.18)');
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerActions: { flexDirection: 'row', gap: 16 },
    backBtn: { color: c.textMuted, fontSize: 15 },
    actionLink: { color: c.textMuted, fontSize: 14 },
    titleBlock: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
    colorDot: { width: 12, height: 36, borderRadius: 6, marginTop: 4 },
    title: { fontSize: 22, fontWeight: '700' },
    description: { color: c.textMuted, fontSize: 13, marginTop: 4 },
    descriptionText: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    sectionLabel: { color: c.textFaint, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
    section: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    milestoneTitle: { fontSize: 15, fontWeight: '700' },
    milestoneSub: { fontSize: 13, marginTop: 2 },
    row: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
    btnAccentText: { color: '#030712', fontSize: 13, fontWeight: '600' },
    btnGhostText: { color: c.textPrimary, fontSize: 13 },
    completeBtn: {
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      marginBottom: 16,
    },
    completeText: { fontSize: 15, fontWeight: '700' },
    muted: { color: c.textMuted, fontSize: 13 },
    reopenBtn: {
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      marginBottom: 12,
    },
    reopenText: { fontSize: 13, fontWeight: '600' },
  });
}
