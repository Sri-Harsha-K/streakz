import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useAppData } from '../state/AppDataContext';
import { Icon, IconName } from '../components/Icon';
import { BackupModal } from '../components/BackupModal';
import { ONBOARDED_KEY, USER_NAME_KEY } from './OnboardingScreen';

type Props = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface RowProps {
  icon: IconName;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}

function SettingsRow({ icon, label, value, toggle, toggleOn, onToggle, onPress, danger, last }: RowProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const tint = danger ? '#E14545' : colors.textMuted;
  const labelColor = danger ? '#E14545' : colors.textPrimary;

  const content = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.elevated2 }]}>
        <Icon name={icon} size={15} color={tint} stroke={1.7} />
      </View>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      {toggle ? (
        <Switch
          value={!!toggleOn}
          onValueChange={onToggle}
          trackColor={{ true: colors.accent, false: colors.elevated2 }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.rowEnd}>
          {value && <Text style={styles.value}>{value}</Text>}
          <Icon name="chevron" size={14} color={colors.textFaint} stroke={1.7} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: colors.elevated2 }}>
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

function SettingsGroup({ title, children }: GroupProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

const REMINDERS_ENABLED_KEY = 'streakapp_reminders_enabled';
const FREEZE_ENABLED_KEY = 'streakapp_freeze_warnings';

export function SettingsScreen({ navigation }: Props) {
  const { theme, colors, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const { archivedTasks, clearAll } = useAppData();
  const styles = makeStyles(colors);

  const [backupOpen, setBackupOpen] = useState(false);
  const [remindersOn, setRemindersOn] = useState(true);
  const [freezeOn, setFreezeOn] = useState(true);

  // hydrate prefs (display only; daily/freeze schedulers ignore these for now)
  useMemo(() => {
    AsyncStorage.getItem(REMINDERS_ENABLED_KEY).then((v) => {
      if (v === '0') setRemindersOn(false);
    });
    AsyncStorage.getItem(FREEZE_ENABLED_KEY).then((v) => {
      if (v === '0') setFreezeOn(false);
    });
  }, []);

  function setRemindersPref(v: boolean) {
    setRemindersOn(v);
    AsyncStorage.setItem(REMINDERS_ENABLED_KEY, v ? '1' : '0').catch(() => {});
  }
  function setFreezePref(v: boolean) {
    setFreezeOn(v);
    AsyncStorage.setItem(FREEZE_ENABLED_KEY, v ? '1' : '0').catch(() => {});
  }

  function confirmWipe() {
    Alert.alert(
      'Erase all data?',
      'Deletes every habit and all completion history. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase all', style: 'destructive', onPress: clearAll },
      ],
    );
  }

  async function replayOnboarding() {
    await AsyncStorage.multiRemove([ONBOARDED_KEY, USER_NAME_KEY]);
    navigation.replace('Onboarding');
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="Appearance">
          <SettingsRow icon="moon" label="Dark mode" toggle toggleOn={theme === 'dark'} onToggle={toggle} last />
        </SettingsGroup>

        <SettingsGroup title="Reminders">
          <SettingsRow icon="bell" label="Daily reminders" toggle toggleOn={remindersOn} onToggle={setRemindersPref} />
          <SettingsRow icon="snow" label="Freeze warnings" toggle toggleOn={freezeOn} onToggle={setFreezePref} last />
        </SettingsGroup>

        <SettingsGroup title="Habits">
          <SettingsRow icon="archive" label="Archived habits" value={String(archivedTasks.length)} last />
        </SettingsGroup>

        <SettingsGroup title="Data">
          <SettingsRow icon="export" label="Export data" onPress={() => setBackupOpen(true)} />
          <SettingsRow icon="import" label="Import data" onPress={() => setBackupOpen(true)} />
          <SettingsRow icon="trash" label="Clear all data" danger onPress={confirmWipe} last />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow icon="user" label="Replay onboarding" onPress={replayOnboarding} last />
        </SettingsGroup>

        <Text style={styles.version}>Streakz · v1.0</Text>
      </ScrollView>

      <BackupModal visible={backupOpen} onClose={() => setBackupOpen(false)} />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
    title: { color: c.textPrimary, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
    scroll: { paddingBottom: 40 },

    group: { marginBottom: 14 },
    groupTitle: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingBottom: 5,
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
      paddingVertical: 10,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    iconWrap: {
      width: 28, height: 28, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
    },
    label: { flex: 1, fontSize: 14, fontWeight: '500' },
    rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { color: c.textMuted, fontSize: 12 },

    version: {
      textAlign: 'center',
      color: c.textFaint,
      fontSize: 10,
      paddingTop: 4,
      paddingBottom: 12,
    },
  });
}
