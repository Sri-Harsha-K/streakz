import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useAppData } from '../state/AppDataContext';
import { Icon, IconName } from '../components/Icon';
import { TimePickerModal } from '../components/ReminderPicker';
import { hueToAccent } from '../utils/color';
import { isTaskFrozen } from '../utils/streak';
import { ensureNotificationPermission, parseHHMM } from '../utils/reminders';
import {
  getPrefsSync,
  hydratePrefs,
  setFreezeWarningsEnabled,
  setRemindersEnabled,
  subscribePrefs,
} from '../utils/prefs';
import { Task } from '../types';

type Props = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Reminders'>,
  NativeStackScreenProps<RootStackParamList>
>;

type PermissionState =
  | { kind: 'unknown' }
  | { kind: 'granted' }
  | { kind: 'denied'; canAskAgain: boolean };

interface RowProps {
  icon?: IconName;
  iconColor?: string;
  label: string;
  description?: string;
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
}

function Row({ icon, iconColor, label, description, toggle, toggleOn, onToggle, onPress, onLongPress, trailing, last }: RowProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const tint = iconColor ?? colors.textMuted;

  const content = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: colors.elevated2 }]}>
          <Icon name={icon} size={15} color={tint} stroke={1.7} />
        </View>
      )}
      <View style={styles.rowMid}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {description && <Text style={styles.desc}>{description}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={!!toggleOn}
          onValueChange={onToggle}
          trackColor={{ true: colors.accent, false: colors.elevated2 }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.rowEnd}>
          {trailing}
          {onPress && <Icon name="chevron" size={14} color={colors.textFaint} stroke={1.7} />}
        </View>
      )}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable onPress={onPress} onLongPress={onLongPress} android_ripple={{ color: colors.elevated2 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

interface GroupProps {
  title: string;
  children: React.ReactNode;
}

function Group({ title, children }: GroupProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

function compareReminderTime(a: Task, b: Task): number {
  const ap = parseHHMM(a.reminderTime ?? '');
  const bp = parseHHMM(b.reminderTime ?? '');
  if (!ap && !bp) return 0;
  if (!ap) return 1;
  if (!bp) return -1;
  return (ap.hour - bp.hour) || (ap.minute - bp.minute);
}

export function RemindersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const {
    tasks,
    updateTask,
    cancelAllDailyReminders,
    rescheduleAllDailyReminders,
    cancelAllFreezeReminders,
  } = useAppData();

  const [perm, setPerm] = useState<PermissionState>({ kind: 'unknown' });
  const [remindersOn, setRemindersOn] = useState<boolean>(getPrefsSync().remindersEnabled);
  const [freezeOn, setFreezeOn] = useState<boolean>(getPrefsSync().freezeWarningsEnabled);
  const [withoutOpen, setWithoutOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const refreshPermission = useCallback(async () => {
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) setPerm({ kind: 'granted' });
      else setPerm({ kind: 'denied', canAskAgain: !!settings.canAskAgain });
    } catch {
      setPerm({ kind: 'denied', canAskAgain: false });
    }
  }, []);

  useEffect(() => {
    void refreshPermission();
    void hydratePrefs().then(() => {
      const p = getPrefsSync();
      setRemindersOn(p.remindersEnabled);
      setFreezeOn(p.freezeWarningsEnabled);
    });
    const unsub = subscribePrefs((next) => {
      setRemindersOn(next.remindersEnabled);
      setFreezeOn(next.freezeWarningsEnabled);
    });
    const focusSub = navigation.addListener('focus', () => {
      void refreshPermission();
    });
    return () => {
      unsub();
      focusSub();
    };
  }, [navigation, refreshPermission]);

  const withReminder = useMemo(
    () => tasks.filter((t) => t.reminderTime !== null).slice().sort(compareReminderTime),
    [tasks],
  );
  const withoutReminder = useMemo(
    () => tasks.filter((t) => t.reminderTime === null),
    [tasks],
  );

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) ?? null : null;

  async function handleEnableReminders(value: boolean) {
    setRemindersOn(value);
    await setRemindersEnabled(value);
    if (value) {
      const granted = await ensureNotificationPermission();
      if (granted) rescheduleAllDailyReminders();
      void refreshPermission();
    } else {
      cancelAllDailyReminders();
    }
  }

  async function handleFreezeWarnings(value: boolean) {
    setFreezeOn(value);
    await setFreezeWarningsEnabled(value);
    if (!value) {
      cancelAllFreezeReminders();
    }
    // Re-enable: useStreakApp's freeze useEffect will repopulate naturally on next state tick.
  }

  async function requestPerm() {
    const ok = await ensureNotificationPermission();
    if (ok) setPerm({ kind: 'granted' });
    else void refreshPermission();
  }

  function confirmTurnOff(task: Task) {
    Alert.alert(
      'Turn off reminder?',
      `Stop daily reminders for "${task.title}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn off',
          style: 'destructive',
          onPress: () => updateTask(task.id, { reminderTime: null }),
        },
      ],
    );
  }

  function handlePickerConfirm(time: string) {
    if (editingTaskId) updateTask(editingTaskId, { reminderTime: time });
    setEditingTaskId(null);
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Text style={styles.subtitle}>One place for every notification.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Group title="Permission">
          {perm.kind === 'granted' && (
            <Row
              icon="check"
              iconColor="#3CB371"
              label="Notifications enabled"
              description="The system will deliver scheduled reminders."
              last
            />
          )}
          {perm.kind === 'denied' && perm.canAskAgain && (
            <Row
              icon="bell"
              iconColor="#D9A24A"
              label="Tap to enable"
              description="We need permission to deliver reminders."
              onPress={requestPerm}
              last
            />
          )}
          {perm.kind === 'denied' && !perm.canAskAgain && (
            <Row
              icon="bell"
              iconColor="#E14545"
              label="Disabled in system settings"
              description="Open settings to allow notifications."
              onPress={() => { void Linking.openSettings(); }}
              last
            />
          )}
          {perm.kind === 'unknown' && (
            <Row icon="bell" label="Checking permission…" last />
          )}
        </Group>

        <Group title="Master switches">
          <Row
            icon="bell"
            label="Daily reminders"
            description="Time-of-day nudges for each habit."
            toggle
            toggleOn={remindersOn}
            onToggle={(v) => { void handleEnableReminders(v); }}
          />
          <Row
            icon="snow"
            label="Freeze warnings"
            description="Urgent pings when a streak is using its grace day."
            toggle
            toggleOn={freezeOn}
            onToggle={(v) => { void handleFreezeWarnings(v); }}
            last
          />
        </Group>

        <Group title="Today's schedule">
          {withReminder.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>No reminders set.</Text>
              <Text style={styles.emptyHint}>Add one when creating or editing a habit.</Text>
            </View>
          ) : (
            withReminder.map((task, i) => {
              const accent = hueToAccent(task.color);
              const frozen = isTaskFrozen(task);
              const isLast = i === withReminder.length - 1;
              return (
                <Pressable
                  key={task.id}
                  onPress={() => setEditingTaskId(task.id)}
                  onLongPress={() => confirmTurnOff(task)}
                  android_ripple={{ color: colors.elevated2 }}
                >
                  <View style={[styles.row, !isLast && styles.rowDivider]}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <View style={styles.rowMid}>
                      <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      {!remindersOn && (
                        <Text style={styles.desc}>Paused — master toggle off</Text>
                      )}
                    </View>
                    {frozen && (
                      <View style={styles.frozenBadge}>
                        <Text style={styles.frozenText}>❄ Frozen</Text>
                      </View>
                    )}
                    <Text style={[styles.timeText, { color: accent }]}>{task.reminderTime}</Text>
                    <Text style={styles.editHint}>Edit</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </Group>

        <Group title="Habits without reminders">
          <Pressable
            onPress={() => setWithoutOpen((v) => !v)}
            android_ripple={{ color: colors.elevated2 }}
          >
            <View style={[styles.row, withoutOpen && withoutReminder.length > 0 && styles.rowDivider]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.elevated2 }]}>
                <Icon name="list" size={15} color={colors.textMuted} stroke={1.7} />
              </View>
              <View style={styles.rowMid}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {withoutReminder.length} habit{withoutReminder.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.desc}>Tap to {withoutOpen ? 'collapse' : 'expand'}.</Text>
              </View>
              <View style={[styles.chevron, withoutOpen && styles.chevronOpen]}>
                <Icon name="chevron" size={14} color={colors.textFaint} stroke={1.7} />
              </View>
            </View>
          </Pressable>
          {withoutOpen && withoutReminder.map((task, i) => {
            const accent = hueToAccent(task.color);
            const isLast = i === withoutReminder.length - 1;
            return (
              <Pressable
                key={task.id}
                onPress={() => setEditingTaskId(task.id)}
                android_ripple={{ color: colors.elevated2 }}
              >
                <View style={[styles.row, !isLast && styles.rowDivider]}>
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                  <View style={styles.rowMid}>
                    <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.desc}>No reminder set</Text>
                  </View>
                  <Text style={styles.editHint}>Set time</Text>
                  <Icon name="chevron" size={14} color={colors.textFaint} stroke={1.7} />
                </View>
              </Pressable>
            );
          })}
          {withoutOpen && withoutReminder.length === 0 && (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyHint}>Every active habit already has a reminder.</Text>
            </View>
          )}
        </Group>
      </ScrollView>

      <TimePickerModal
        visible={editingTask !== null}
        initial={editingTask?.reminderTime ?? '09:00'}
        accent={editingTask ? hueToAccent(editingTask.color) : colors.accent}
        onClose={() => setEditingTaskId(null)}
        onPick={handlePickerConfirm}
      />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
    title: { color: c.textPrimary, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
    subtitle: { color: c.textMuted, fontSize: 13, marginTop: 4 },
    scroll: { paddingBottom: 40 },

    group: { marginBottom: 14 },
    groupTitle: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingBottom: 6,
    },
    groupBody: {
      marginHorizontal: 14,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    rowMid: { flex: 1, gap: 2 },
    iconWrap: {
      width: 28, height: 28, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
    },
    label: { fontSize: 14, fontWeight: '500' },
    desc: { color: c.textFaint, fontSize: 11 },
    rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6 },

    dot: { width: 12, height: 12, borderRadius: 6, marginLeft: 6 },
    timeText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
    editHint: { color: c.textFaint, fontSize: 11 },

    chevron: { transform: [{ rotate: '90deg' }] },
    chevronOpen: { transform: [{ rotate: '270deg' }] },

    emptyBlock: { paddingHorizontal: 16, paddingVertical: 18, alignItems: 'flex-start', gap: 4 },
    emptyText: { color: c.textPrimary, fontSize: 13, fontWeight: '600' },
    emptyHint: { color: c.textMuted, fontSize: 12 },

    frozenBadge: {
      backgroundColor: 'rgba(125,180,255,0.18)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    frozenText: { color: '#7DB4FF', fontSize: 11, fontWeight: '700' },
  });
}
