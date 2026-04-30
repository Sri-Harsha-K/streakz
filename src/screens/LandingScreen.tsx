import { useRef } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { isTodayCompleted } from '../utils/streak';
import { hueToAccent } from '../utils/color';
import { daysBetween, today } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function dayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function LandingScreen({ navigation }: Props) {
  const { theme, colors, toggle } = useTheme();
  const { tasks, completions } = useAppData();
  const insets = useSafeAreaInsets();

  const total = tasks.length;
  const doneToday = tasks.filter(t => isTodayCompleted(t.id, completions)).length;
  const pending = total - doneToday;

  const efficiency = total === 0
    ? 0
    : Math.round(
        (tasks.reduce((acc, t) => acc + Math.min(1, t.currentStreak / t.targetStreak), 0) / total) * 100,
      );

  const heroHues: [string, string] = total === 0
    ? ['#3b82f6', '#8b5cf6']
    : (() => {
        const sorted = [...tasks].sort((a, b) => b.currentStreak - a.currentStreak);
        const a = hueToAccent(sorted[0].color);
        const b = hueToAccent(sorted[Math.min(1, sorted.length - 1)].color);
        return [a, b];
      })();

  const styles = makeStyles(colors);
  const ctaBottom = Math.max(insets.bottom, 16);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dx < -40 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -70 && g.vx <= 0) navigation.navigate('Home');
      },
    }),
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.container, { paddingTop: Math.max(insets.top, 24) + 36, paddingBottom: ctaBottom }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{dayLabel()}</Text>
          <Text style={styles.title}>{greeting()}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={toggle}>
          <Text style={styles.iconText}>{theme === 'dark' ? '☾' : '☀'}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={heroHues}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>Streak efficiency</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{efficiency}</Text>
            <Text style={styles.heroUnit}>%</Text>
          </View>
          <View style={styles.heroBarTrack}>
            <View style={[styles.heroBarFill, { width: `${efficiency}%` }]} />
          </View>
          <Text style={styles.heroFoot}>
            {total === 0
              ? 'Create your first habit to start tracking'
              : `${doneToday} of ${total} done today`}
          </Text>
        </LinearGradient>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Total habits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, pending === 0 && total > 0 && { color: '#22c55e' }]}>
              {pending}
            </Text>
            <Text style={styles.statLabel}>
              {pending === 0 && total > 0 ? 'All done' : 'Pending today'}
            </Text>
          </View>
        </View>

        {total > 0 && (
          <>
            <Text style={styles.sectionLabel}>Today's habits</Text>
            <View style={styles.previewBox}>
              <ScrollView
                style={styles.previewScroll}
                showsVerticalScrollIndicator={tasks.length > 4}
              >
                {tasks.map((task, i) => {
                  const accent = hueToAccent(task.color);
                  const done = isTodayCompleted(task.id, completions);
                  const isLast = i === tasks.length - 1;
                  const frozen =
                    !done &&
                    task.currentStreak > 0 &&
                    !!task.lastCompletedDate &&
                    daysBetween(task.lastCompletedDate, today()) === 2;
                  return (
                    <View
                      key={task.id}
                      style={[styles.previewRow, !isLast && styles.previewRowDivider]}
                    >
                      <View style={[styles.previewDot, { backgroundColor: accent }]} />
                      <Text style={[styles.previewName, done && styles.previewNameDone]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      {frozen && (
                        <View style={styles.frozenBadge}>
                          <Text style={styles.frozenText}>❄ Frozen</Text>
                        </View>
                      )}
                      <Text style={[styles.previewStreak, { color: accent }]}>
                        {task.currentStreak}/{task.targetStreak}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </>
        )}
      </View>

      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate('Home')}
        hitSlop={10}
        android_ripple={{ color: colors.elevated2 }}
      >
        <Text style={styles.ctaText}>Go to Tasks  →</Text>
      </Pressable>
      <Text style={styles.swipeHint}>or swipe left</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20,
    },
    eyebrow: { color: c.textFaint, fontSize: 12, marginBottom: 2, letterSpacing: 0.4, textTransform: 'uppercase' },
    title: { color: c.textPrimary, fontSize: 26, fontWeight: '700' },
    iconBtn: {
      backgroundColor: c.elevated2,
      width: 40, height: 36,
      borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    iconText: { color: c.textPrimary, fontSize: 16, fontWeight: '600' },

    hero: {
      borderRadius: 20,
      padding: 22,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 5,
    },
    heroLabel: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    heroValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
    heroValue: { color: '#fff', fontSize: 64, fontWeight: '800', letterSpacing: -2 },
    heroUnit: { color: 'rgba(255,255,255,0.85)', fontSize: 28, fontWeight: '700', marginLeft: 4 },
    heroBarTrack: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 12,
    },
    heroBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
    heroFoot: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 10, fontWeight: '500' },

    statRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    statCard: {
      flex: 1,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: 14,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 5,
      elevation: 2,
    },
    statValue: { color: c.textPrimary, fontSize: 28, fontWeight: '700' },
    statLabel: { color: c.textMuted, fontSize: 12, marginTop: 2 },

    sectionLabel: {
      color: c.textFaint,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginTop: 4,
    },
    previewBox: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: 14,
      paddingVertical: 4,
      maxHeight: 4 * 50 + 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 5,
      elevation: 2,
    },
    previewScroll: { flexGrow: 0 },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      paddingHorizontal: 14,
      gap: 10,
    },
    previewRowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderSubtle },
    previewDot: { width: 8, height: 8, borderRadius: 4 },
    previewName: { flex: 1, color: c.textPrimary, fontSize: 14, fontWeight: '500' },
    previewNameDone: { color: c.textFaint, textDecorationLine: 'line-through' },
    previewStreak: { fontSize: 12, fontWeight: '700' },
    frozenBadge: {
      backgroundColor: 'rgba(56,189,248,0.18)',
      borderColor: 'rgba(56,189,248,0.6)',
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginRight: 4,
    },
    frozenText: { color: '#7dd3fc', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    previewCheck: { fontSize: 18, fontWeight: '700', width: 18, textAlign: 'center' },
    previewCheckOn: { color: '#22c55e' },
    previewCheckOff: { color: c.textFaint },
    previewMore: {
      color: c.textFaint,
      fontSize: 12,
      textAlign: 'center',
      paddingVertical: 10,
    },

    cta: {
      backgroundColor: c.textPrimary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    ctaText: { color: c.surface, fontSize: 16, fontWeight: '700' },
    swipeHint: { color: c.textFaint, fontSize: 11, textAlign: 'center', marginTop: 6 },
  });
}
