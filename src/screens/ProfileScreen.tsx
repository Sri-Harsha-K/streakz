import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useAppData } from '../state/AppDataContext';
import { Icon } from '../components/Icon';
import { ActivityHeatMap } from '../components/ActivityHeatMap';
import { hueToAccent, hueToAccentBg } from '../utils/color';
import { MAX_ACTIVE_TASKS } from '../hooks/useStreakApp';
import { USER_NAME_KEY } from './OnboardingScreen';

type Props = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { tasks, archivedTasks, completions, updateTask } = useAppData();
  const styles = makeStyles(colors);
  const dark = theme === 'dark';

  const [userName, setUserName] = useState<string>('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      AsyncStorage.getItem(USER_NAME_KEY).then((v) => setUserName(v ?? ''));
    });
    return sub;
  }, [navigation]);

  const stats = useMemo(() => {
    const all = [...tasks, ...archivedTasks];
    const totalDone = completions.length;
    const longest = all.reduce((m, t) => Math.max(m, t.longestStreak ?? 0), 0);
    return { totalDone, longest };
  }, [tasks, archivedTasks, completions]);

  const milestones = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const ar = a.currentStreak / Math.max(a.targetStreak, 1);
        const br = b.currentStreak / Math.max(b.targetStreak, 1);
        return br - ar;
      })
      .slice(0, 3);
  }, [tasks]);

  const initial = (userName || 'You').trim().charAt(0).toUpperCase() || 'Y';
  const avatarA = hueToAccent(50, dark);
  const avatarB = hueToAccent(22, dark);

  function startEditName() {
    setDraftName(userName);
    setEditingName(true);
  }

  async function saveName() {
    const trimmed = draftName.trim().slice(0, 32);
    if (trimmed) {
      await AsyncStorage.setItem(USER_NAME_KEY, trimmed);
    } else {
      await AsyncStorage.removeItem(USER_NAME_KEY);
    }
    setUserName(trimmed);
    setEditingName(false);
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[avatarA, avatarB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarLetter}>{initial}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  maxLength={32}
                  style={styles.nameInput}
                />
                <Pressable onPress={saveName} hitSlop={8}>
                  <Icon name="check" size={18} color={colors.accent} stroke={2.4} />
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.name}>{userName || 'You'}</Text>
                <Text style={styles.subtle}>{tasks.length} active habits</Text>
              </>
            )}
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={editingName ? saveName : startEditName}
            hitSlop={8}
          >
            <Icon name={editingName ? 'check' : 'edit'} size={14} color={colors.textMuted} stroke={1.8} />
          </Pressable>
        </View>

        <View style={styles.statRow}>
          <StatTile label="Active" value={tasks.length} sub={`of ${MAX_ACTIVE_TASKS}`} />
          <StatTile label="Longest" value={stats.longest} sub="day streak" accent={colors.accent} />
          <StatTile label="Total" value={stats.totalDone} sub="ticks" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <Text style={styles.sectionSub}>Last 14 weeks</Text>
        </View>
        <View style={styles.card}>
          <ActivityHeatMap completions={completions} hue={50} weeks={14} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming milestones</Text>
        </View>
        {milestones.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 22 }]}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              No active habits yet
            </Text>
          </View>
        ) : (
          milestones.map((task) => {
            const accent = hueToAccent(task.color, dark);
            const tintBg = hueToAccentBg(task.color, dark);
            const remain = Math.max(0, task.targetStreak - task.currentStreak);
            const pct = Math.round((task.currentStreak / Math.max(task.targetStreak, 1)) * 100);
            return (
              <Pressable
                key={task.id}
                style={styles.milestoneRow}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                onLongPress={() =>
                  Alert.alert(task.title, 'Open detail to edit, archive, or extend.', [
                    { text: 'OK' },
                  ])
                }
              >
                <View style={[styles.milestoneIcon, { backgroundColor: tintBg }]}>
                  <Icon name="target" size={16} color={accent} stroke={1.8} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.milestoneTitle} numberOfLines={1}>{task.title}</Text>
                  <Text style={styles.milestoneSub}>
                    {task.currentStreak} / {task.targetStreak} · {remain} to go
                  </Text>
                </View>
                <Text style={[styles.milestonePct, { color: accent }]}>{pct}%</Text>
              </Pressable>
            );
          })
        )}

        {/* Touch updateTask import to silence unused warning if no edit happens. Real callers add later. */}
        {false && (
          <Pressable onPress={() => updateTask('', {})}>
            <Text> </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: string;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: accent }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    scroll: { paddingHorizontal: 14, paddingBottom: 40 },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 6,
      paddingTop: 6,
      paddingBottom: 14,
    },
    avatar: {
      width: 52, height: 52, borderRadius: 26,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
    name: { color: c.textPrimary, fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
    subtle: { color: c.textMuted, fontSize: 11, marginTop: 1 },
    nameInput: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      borderBottomWidth: 1,
      borderBottomColor: c.borderDefault,
      paddingVertical: 4,
    },
    editBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      alignItems: 'center', justifyContent: 'center',
    },

    statRow: { flexDirection: 'row', gap: 6, paddingBottom: 14 },
    statTile: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    statLabel: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    statValue: { color: c.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 4, letterSpacing: -0.6, lineHeight: 24 },
    statSub: { color: c.textFaint, fontSize: 11, marginTop: 3 },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: 6,
      paddingTop: 6,
      paddingBottom: 6,
    },
    sectionTitle: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    sectionSub: { color: c.textFaint, fontSize: 11 },

    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      marginBottom: 8,
    },

    milestoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.card,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      marginBottom: 6,
    },
    milestoneIcon: {
      width: 30, height: 30, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    milestoneTitle: { color: c.textPrimary, fontSize: 13, fontWeight: '600' },
    milestoneSub: { color: c.textMuted, fontSize: 11, marginTop: 1 },
    milestonePct: { fontSize: 12, fontWeight: '700' },
  });
}
