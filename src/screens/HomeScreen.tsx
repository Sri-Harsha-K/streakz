import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { BackupModal } from '../components/BackupModal';
import { TaskTile } from '../components/TaskTile';
import { TaskRow } from '../components/TaskRow';
import { Icon } from '../components/Icon';
import { MAX_ACTIVE_TASKS } from '../hooks/useStreakApp';
import { Task } from '../types';

type ViewMode = 'tiles' | 'list';
type TabMode = 'active' | 'archived';
type SortMode = 'created' | 'streak' | 'alpha' | 'recent';
type Props = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SORT_KEY = 'streakapp_sort';
const SORT_OPTIONS: Array<{ id: SortMode; label: string; sub: string }> = [
  { id: 'created', label: 'Created', sub: 'Order added' },
  { id: 'streak', label: 'Streak', sub: 'Highest first' },
  { id: 'alpha', label: 'A–Z', sub: 'Title' },
  { id: 'recent', label: 'Recent', sub: 'Last completion' },
];

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { tasks, archivedTasks, createTask, clearAll, updateTask } = useAppData();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  function confirmWipe() {
    Alert.alert(
      'Erase all data?',
      'This deletes every habit and all completion history. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase all', style: 'destructive', onPress: clearAll },
      ],
    );
  }

  const [createOpen, setCreateOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');
  const [tab, setTab] = useState<TabMode>('active');
  const [sortMode, setSortMode] = useState<SortMode>('created');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SORT_KEY).then((v) => {
      if (v && SORT_OPTIONS.some((o) => o.id === v)) setSortMode(v as SortMode);
    });
  }, []);

  function handleSortChange(next: SortMode) {
    setSortMode(next);
    setSortMenuOpen(false);
    AsyncStorage.setItem(SORT_KEY, next).catch(() => {});
  }

  const baseTasks = tab === 'active' ? tasks : archivedTasks;
  const visibleTasks = useMemo(() => sortTasks(baseTasks, sortMode), [baseTasks, sortMode]);
  const atCap = tasks.length >= MAX_ACTIVE_TASKS;
  const sortLabel = SORT_OPTIONS.find((o) => o.id === sortMode)?.label ?? 'Sort';
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <View style={styles.header}>
        <Text style={styles.title} onLongPress={confirmWipe}>Tasks</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => setSortMenuOpen(true)} hitSlop={6}>
            <Icon name="sort" size={16} color={colors.textMuted} stroke={1.7} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => setBackupOpen(true)} hitSlop={6}>
            <Icon name="export" size={16} color={colors.textMuted} stroke={1.7} />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, atCap && styles.iconBtnDisabled]}
            onPress={() => setCreateOpen(true)}
            disabled={atCap}
            hitSlop={6}
          >
            <Icon name="plus" size={18} color={atCap ? colors.textFaint : colors.textPrimary} stroke={2} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setTab('active')}
          style={[styles.tab, tab === 'active' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</Text>
          <Text style={styles.tabCount}>{tasks.length}</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('archived')}
          style={[styles.tab, tab === 'archived' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'archived' && styles.tabTextActive]}>Archived</Text>
          <Text style={styles.tabCount}>{archivedTasks.length}</Text>
        </Pressable>
      </View>

      {visibleTasks.length > 0 && (
        <View style={styles.toolbar}>
          <View style={styles.segment}>
            {(['tiles', 'list'] as const).map((mode) => {
              const on = viewMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={[styles.segBtn, on && styles.segBtnActive]}
                  hitSlop={4}
                >
                  <Icon
                    name={mode === 'tiles' ? 'home' : 'list'}
                    size={16}
                    color={on ? colors.textPrimary : colors.textMuted}
                    stroke={1.8}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.sortBtn} onPress={() => setSortMenuOpen(true)} hitSlop={6}>
            <Icon name="sort" size={12} color={colors.textMuted} stroke={1.7} />
            <Text style={styles.sortBtnText}>{sortLabel}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {visibleTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'No habits yet' : 'No archived habits'}
            </Text>
            <Text style={styles.emptyHint}>
              {tab === 'active'
                ? 'Track a daily routine. Build a streak.'
                : 'Habits you archive will show up here.'}
            </Text>
            {tab === 'active' && (
              <Pressable style={styles.emptyCta} onPress={() => setCreateOpen(true)} hitSlop={8}>
                <Icon name="plus" size={16} color={colors.accentText} stroke={2.2} />
                <Text style={styles.emptyCtaText}>Create first habit</Text>
              </Pressable>
            )}
          </View>
        ) : viewMode === 'tiles' ? (
          <View style={styles.tilesGrid}>
            {visibleTasks.map((task, idx) => (
              <View key={task.id} style={styles.tileWrap}>
                <TaskTile
                  task={task}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                  onLongPress={() => !task.archived && setEditingTask(task)}
                />
                {idx % 2 === 0 && idx === visibleTasks.length - 1 && <View style={styles.tileSpacer} />}
              </View>
            ))}
          </View>
        ) : (
          visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              onLongPress={() => !task.archived && setEditingTask(task)}
            />
          ))
        )}
      </ScrollView>

      <CreateTaskModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createTask}
      />

      <EditTaskModal
        visible={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={(patch) => editingTask && updateTask(editingTask.id, patch)}
      />

      <BackupModal visible={backupOpen} onClose={() => setBackupOpen(false)} />

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setSortMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={() => {}}>
            <Text style={styles.menuTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => {
              const active = sortMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => handleSortChange(opt.id)}
                  style={[styles.menuRow, active && styles.menuRowActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{opt.label}</Text>
                    <Text style={styles.menuSub}>{opt.sub}</Text>
                  </View>
                  {active && <Icon name="check" size={16} color={colors.textPrimary} stroke={2} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function sortTasks(tasks: ReturnType<typeof useAppData>['tasks'], mode: SortMode): typeof tasks {
  const arr = [...tasks];
  switch (mode) {
    case 'streak':
      return arr.sort((a, b) => b.currentStreak - a.currentStreak || a.title.localeCompare(b.title));
    case 'alpha':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'recent':
      return arr.sort((a, b) => {
        const at = a.lastCompletedDate ?? '';
        const bt = b.lastCompletedDate ?? '';
        if (at === bt) return a.title.localeCompare(b.title);
        return bt.localeCompare(at);
      });
    case 'created':
    default:
      return arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    headerActions: { flexDirection: 'row', gap: 8 },
    title: { color: c.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
    iconBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      alignItems: 'center', justifyContent: 'center',
    },
    iconBtnDisabled: { opacity: 0.4 },

    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
      paddingBottom: 0,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      marginBottom: -1,
    },
    tabActive: { borderBottomColor: c.textPrimary },
    tabText: { color: c.textMuted, fontSize: 15, fontWeight: '600' },
    tabTextActive: { color: c.textPrimary, fontWeight: '700' },
    tabCount: { color: c.textFaint, fontSize: 13, fontWeight: '500' },

    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 10,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      padding: 2,
    },
    segBtn: {
      width: 32, height: 32, borderRadius: 6,
      alignItems: 'center', justifyContent: 'center',
    },
    segBtnActive: { backgroundColor: c.surface },

    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    sortBtnText: { color: c.textMuted, fontSize: 13, fontWeight: '500' },

    menuBackdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      alignItems: 'center', justifyContent: 'center',
      padding: 28,
    },
    menuSheet: {
      width: '100%', maxWidth: 320,
      backgroundColor: c.card, borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderDefault,
      paddingVertical: 8,
    },
    menuTitle: {
      color: c.textFaint, fontSize: 11, fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: 0.6,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
    },
    menuRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
    },
    menuRowActive: { backgroundColor: c.elevated2 },
    menuLabel: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    menuLabelActive: { fontWeight: '700' },
    menuSub: { color: c.textFaint, fontSize: 12, marginTop: 2 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 60 },
    empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 24 },
    emptyTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
    emptyHint: { color: c.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
    emptyCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.accent,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 12,
    },
    emptyCtaText: { color: c.accentText, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

    tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tileWrap: { flexBasis: '48%', flexGrow: 1, maxWidth: '49%' },
    tileSpacer: { flexBasis: '48%', flexGrow: 1 },
  });
}
