import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Completion, Task } from '../types';
import { today, addDays, subDays, daysBetween, formatDisplayDate } from '../utils/date';
import { hueToAccent, hueToHeatCell } from '../utils/color';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface Props {
  task: Task;
  completions: Completion[];
}

type CellStatus = 'completed' | 'missed' | 'today-pending' | 'future';

interface ProgressCell {
  dayIndex: number;
  status: CellStatus;
  date: string;
}

const CELL = 12;
const GAP = 3;

function buildProgressCells(task: Task, completions: Completion[]): ProgressCell[] {
  const t = today();
  const taskCompletions = completions
    .filter(c => c.taskId === task.id)
    .map(c => c.date)
    .sort();
  const completionSet = new Set(taskCompletions);

  let anchor = taskCompletions.length > 0 ? taskCompletions[0] : t;
  if (daysBetween(anchor, t) >= task.targetStreak) {
    anchor = subDays(t, task.targetStreak - 1);
  }

  const cells: ProgressCell[] = [];
  for (let i = 0; i < task.targetStreak; i++) {
    const date = addDays(anchor, i);
    const dayIndex = i + 1;
    if (date > t) cells.push({ dayIndex, status: 'future', date });
    else if (completionSet.has(date)) cells.push({ dayIndex, status: 'completed', date });
    else if (date === t) cells.push({ dayIndex, status: 'today-pending', date });
    else cells.push({ dayIndex, status: 'missed', date });
  }
  return cells;
}

function groupIntoWeeks(cells: ProgressCell[]): ProgressCell[][] {
  const weeks: ProgressCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function cellBg(
  cell: ProgressCell,
  targetStreak: number,
  hue: number,
  c: ThemeColors,
  theme: 'dark' | 'light',
): string {
  const dark = theme === 'dark';
  switch (cell.status) {
    case 'completed': {
      const ratio = cell.dayIndex / targetStreak;
      if (ratio <= 0.33) return hueToHeatCell(hue, 2, dark);
      if (ratio <= 0.66) return hueToHeatCell(hue, 3, dark);
      return hueToHeatCell(hue, 4, dark);
    }
    case 'missed':         return dark ? c.missed : 'rgba(239,68,68,0.18)';
    case 'today-pending':  return dark ? c.elevated : c.elevated3;
    case 'future':         return dark ? c.elevated : c.elevated2;
  }
}

const STATUS_LABEL: Record<CellStatus, string> = {
  completed: 'Completed',
  missed: 'Missed',
  'today-pending': 'Today — pending',
  future: 'Upcoming',
};

export function HeatMap({ task, completions }: Props) {
  const { theme, colors } = useTheme();
  const styles = makeStyles(colors);

  const cells = useMemo(() => buildProgressCells(task, completions), [task, completions]);
  const weeks = useMemo(() => groupIntoWeeks(cells), [cells]);
  const accent = useMemo(() => hueToAccent(task.color, theme === 'dark'), [task.color, theme]);

  const [selected, setSelected] = useState<ProgressCell | null>(null);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.week}>
              {week.map(cell => {
                const bg = cellBg(cell, task.targetStreak, task.color, colors, theme);
                const isPending = cell.status === 'today-pending';
                return (
                  <Pressable
                    key={cell.dayIndex}
                    onPress={() => setSelected(cell)}
                    style={[
                      styles.cell,
                      { backgroundColor: bg },
                      isPending && { borderWidth: 1.5, borderColor: accent },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Day 1</Text>
        {([2, 3, 4] as const).map(level => (
          <View key={level} style={[styles.cell, { backgroundColor: hueToHeatCell(task.color, level, theme === 'dark'), marginHorizontal: 1 }]} />
        ))}
        <Text style={styles.legendText}>Day {task.targetStreak}</Text>
      </View>

      {selected && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTitle}>
            Day {selected.dayIndex} of {task.targetStreak}
          </Text>
          <Text style={styles.tooltipDate}>{formatDisplayDate(selected.date)}</Text>
          <Text
            style={[
              styles.tooltipStatus,
              { color: selected.status === 'completed' ? accent : selected.status === 'missed' ? '#f87171' : colors.textMuted },
            ]}
          >
            {STATUS_LABEL[selected.status]}
          </Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    grid: { flexDirection: 'row', gap: GAP, paddingVertical: 4 },
    week: { flexDirection: 'column', gap: GAP },
    cell: { width: CELL, height: CELL, borderRadius: 2 },
    legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6, gap: 2 },
    legendText: { color: c.textFaint, fontSize: 10, marginHorizontal: 4 },
    tooltip: {
      marginTop: 8,
      padding: 10,
      backgroundColor: c.elevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    tooltipTitle: { color: c.textPrimary, fontSize: 13, fontWeight: '600' },
    tooltipDate: { color: c.textFaint, fontSize: 11, marginTop: 2 },
    tooltipStatus: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  });
}
