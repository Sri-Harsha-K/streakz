import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Completion } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { hueToHeatCell } from '../utils/color';
import { addDays, parseLocalDate, today } from '../utils/date';

interface Props {
  completions: Completion[];
  hue?: number;
  weeks?: number;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ActivityHeatMap({ completions, hue = 50, weeks = 14 }: Props) {
  const { theme, colors } = useTheme();
  const dark = theme === 'dark';

  const { grid, monthMarkers } = useMemo(() => {
    const t = today();
    const todayDow = parseLocalDate(t).getDay();
    const end = addDays(t, 6 - todayDow);
    const start = addDays(end, -(weeks * 7 - 1));

    const counts = new Map<string, number>();
    for (const c of completions) counts.set(c.date, (counts.get(c.date) ?? 0) + 1);

    const grid: { level: 0 | 1 | 2 | 3 | 4; future: boolean }[][] = [];
    const monthMarkers: { week: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < weeks; w++) {
      const colStartDate = parseLocalDate(addDays(start, w * 7));
      const m = colStartDate.getMonth();
      if (m !== lastMonth) {
        monthMarkers.push({ week: w, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
      const col: { level: 0 | 1 | 2 | 3 | 4; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const future = date > t;
        const n = counts.get(date) ?? 0;
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (n >= 6) level = 4;
        else if (n >= 4) level = 3;
        else if (n >= 2) level = 2;
        else if (n >= 1) level = 1;
        col.push({ level, future });
      }
      grid.push(col);
    }
    return { grid, monthMarkers };
  }, [completions, weeks]);

  const palette: string[] = [
    colors.heat0,
    hueToHeatCell(hue, 1, dark),
    hueToHeatCell(hue, 2, dark),
    hueToHeatCell(hue, 3, dark),
    hueToHeatCell(hue, 4, dark),
  ];

  return (
    <View>
      <View style={styles.monthRow}>
        <View style={styles.dayLabelGutter} />
        <View style={styles.monthTrack}>
          {monthMarkers.map((m) => {
            if (m.week > weeks - 2) return null;
            return (
              <Text
                key={`${m.week}-${m.label}`}
                style={[styles.monthLabel, { color: colors.textFaint, left: `${(m.week / weeks) * 100}%` }]}
              >
                {m.label}
              </Text>
            );
          })}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.dayLabelCol}>
          {DAY_LABELS.map((l, i) => (
            <View key={i} style={styles.dayLabelCell}>
              <Text style={[styles.dayLabel, { color: colors.textFaint }]}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {grid.map((col, wi) => (
            <View key={wi} style={styles.col}>
              {col.map((c, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    { backgroundColor: c.future ? colors.heat0 : palette[c.level] },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textFaint }]}>Less</Text>
        {palette.map((bg, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: bg }]} />
        ))}
        <Text style={[styles.legendText, { color: colors.textFaint }]}>More</Text>
      </View>
    </View>
  );
}

const DAY_GUTTER = 14;
const GUTTER_GAP = 6;

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayLabelGutter: { width: DAY_GUTTER, marginRight: GUTTER_GAP },
  monthTrack: { flex: 1, height: 12, position: 'relative' },
  monthLabel: { position: 'absolute', top: 0, fontSize: 10, fontWeight: '500' },

  body: { flexDirection: 'row', alignItems: 'stretch' },
  dayLabelCol: { width: DAY_GUTTER, marginRight: GUTTER_GAP, flexDirection: 'column', gap: 3 },
  dayLabelCell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dayLabel: { fontSize: 9, fontWeight: '500' },

  grid: { flex: 1, flexDirection: 'row', gap: 3 },
  col: { flex: 1, flexDirection: 'column', gap: 3 },
  cell: { aspectRatio: 1, borderRadius: 3 },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' },
  legendText: { fontSize: 10 },
  legendCell: { width: 8, height: 8, borderRadius: 2 },
});
