import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { isTodayCompleted, isTaskFrozen } from '../utils/streak';
import { hueToAccent } from '../utils/color';
import { Icon } from '../components/Icon';
import { USER_NAME_KEY } from './OnboardingScreen';

type Props = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Landing'>,
  NativeStackScreenProps<RootStackParamList>
>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function dayLabel(): string {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase();
}

export function LandingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { tasks, completions } = useAppData();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      AsyncStorage.getItem(USER_NAME_KEY).then((v) => setUserName(v ?? ''));
    });
    return sub;
  }, [navigation]);

  const total = tasks.length;
  const doneToday = tasks.filter((t) => isTodayCompleted(t.id, completions)).length;
  const pending = total - doneToday;
  const efficiency =
    total === 0 ? 0 : Math.round((doneToday / total) * 100);

  const styles = makeStyles(colors);
  const isMoon = (() => {
    const h = new Date().getHours();
    return h < 5 || h >= 21;
  })();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{dayLabel()}</Text>
          <Text style={styles.title}>
            {greeting()}{userName ? `, ${userName}` : ''}
          </Text>
        </View>
        <View style={styles.todIcon}>
          {isMoon ? (
            <Icon name="moon" size={20} color="#FACC15" stroke={1.4} fill="#FACC15" />
          ) : (
            <Icon name="sun" size={22} color="#FACC15" stroke={2} />
          )}
        </View>
      </View>

      <View style={styles.heroWrap}>
        <LinearGradient
          colors={['#3b6ee0', '#7a4fcf']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>STREAK EFFICIENCY</Text>
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
              : `${doneToday} of ${total} habits done today`}
          </Text>
        </LinearGradient>
      </View>

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
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={tasks.length > 5}
          >
            {tasks.map((task, i) => {
              const accent = hueToAccent(task.color);
              const done = isTodayCompleted(task.id, completions);
              const frozen = !done && isTaskFrozen(task);
              const isLast = i === tasks.length - 1;
              return (
                <View
                  key={task.id}
                  style={[styles.row, !isLast && styles.rowDivider]}
                >
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                  <Text
                    style={[styles.rowName, done && styles.rowNameDone]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {frozen && (
                    <View style={styles.frozenBadge}>
                      <Text style={styles.frozenText}>❄ Frozen</Text>
                    </View>
                  )}
                  <Text style={[styles.rowStreak, { color: accent }]}>
                    {task.currentStreak}/{task.targetStreak}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
      <View style={{ flex: total === 0 ? 1 : 0 }} />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
    },
    header: {
      paddingHorizontal: 6,
      paddingTop: 14,
      paddingBottom: 18,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    eyebrow: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.8,
    },
    title: {
      color: c.textPrimary,
      fontSize: 26,
      fontWeight: '800',
      marginTop: 4,
      letterSpacing: -0.6,
    },
    todIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroWrap: { paddingBottom: 14 },
    hero: {
      borderRadius: 22,
      paddingVertical: 22,
      paddingHorizontal: 22,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 6,
    },
    heroLabel: {
      color: 'rgba(255,255,255,0.95)',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.4,
    },
    heroValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
    heroValue: { color: '#fff', fontSize: 56, fontWeight: '800', letterSpacing: -2, lineHeight: 56 },
    heroUnit: { color: 'rgba(255,255,255,0.92)', fontSize: 22, fontWeight: '700', marginLeft: 4 },
    heroBarTrack: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.28)',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 14,
    },
    heroBarFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 2 },
    heroFoot: { color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '600', marginTop: 12 },

    statRow: { flexDirection: 'row', gap: 10, paddingBottom: 14 },
    statCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    statValue: { color: c.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28 },
    statLabel: { color: c.textMuted, fontSize: 12, marginTop: 6, fontWeight: '500' },

    sectionLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      paddingHorizontal: 6,
      paddingTop: 4,
      paddingBottom: 8,
    },
    listScroll: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    listContent: { paddingVertical: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 10,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    rowName: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    rowNameDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    rowStreak: { fontSize: 13, fontWeight: '700' },
    frozenBadge: {
      backgroundColor: 'rgba(125,180,255,0.18)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    frozenText: { color: '#7DB4FF', fontSize: 11, fontWeight: '700' },
  });
}
