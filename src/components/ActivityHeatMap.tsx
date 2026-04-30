import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Completion } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { hueToHeatCell } from '../utils/color';
import { addDays, today } from '../utils/date';

interface Props {
  completions: Completion[];
  hue?: number;
  weeks?: number;
}

export function ActivityHeatMap({ completions, hue = 50, weeks = 14 }: Props) {
  const { theme, colors } = useTheme();
  const dark = theme === 'dark';

  const cells = useMemo(() => {
    const t = today();
    const totalDays = weeks * 7;
    const startCursor = addDays(t, -(totalDays - 1));
    const todayDow = new Date(t).getDay();
    const startDow = new Date(startCursor).getDay();
    const offset = (startDow - 0 + 7) % 7;
    const start = addDays(startCursor, -offset);
    void todayDow;

    const counts = new Map<string, number>();
    for (const c of completions) counts.set(c.date, (counts.get(c.date) ?? 0) + 1);

    const grid: { level: 0 | 1 | 2 | 3 | 4; future: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
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
    return grid;
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
      <View style={styles.grid}>
        {cells.map((col, wi) => (
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

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 3, width: '100%' },
  col: { flex: 1, flexDirection: 'column', gap: 3 },
  cell: { aspectRatio: 1, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' },
  legendText: { fontSize: 10 },
  legendCell: { width: 8, height: 8, borderRadius: 2 },
});
