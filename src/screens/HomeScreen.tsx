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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { BackupModal } from '../components/BackupModal';
import { TaskTile } from '../components/TaskTile';
import { TaskRow } from '../components/TaskRow';
import { MAX_ACTIVE_TASKS } from '../hooks/useStreakApp';
import { Task } from '../types';

type ViewMode = 'tiles' | 'list';
type TabMode = 'active' | 'archived';
type SortMode = 'created' | 'streak' | 'alpha' | 'recent';
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const SORT_KEY = 'streakapp_sort';
const SORT_OPTIONS: Array<{ id: SortMode; label: string; sub: string }> = [
  { id: 'created', label: 'Created', sub: 'Order added' },
  { id: 'streak', label: 'Streak', sub: 'Highest first' },
  { id: 'alpha', label: 'A–Z', sub: 'Title' },
  { id: 'recent', label: 'Recent', sub: 'Last completion' },
];

export function HomeScreen({ navigation }: Props) {
  const { theme, colors, toggle } = useTheme();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} onLongPress={confirmWipe}>StreakApp</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => setBackupOpen(true)}>
            <Text style={styles.iconText}>⇪</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={toggle}>
            <Text style={styles.iconText}>{theme === 'dark' ? '☾' : '☀'}</Text>
          </Pressable>
          <Pressable
            style={[styles.iconBtn, atCap && styles.iconBtnDisabled]}
            onPress={() => setCreateOpen(true)}
            disabled={atCap}
          >
            <Text style={[styles.iconText, atCap && styles.iconTextDisabled]}>＋</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setTab('active')}
          style={[styles.tab, tab === 'active' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Active <Text style={styles.tabCount}>{tasks.length}</Text>
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('archived')}
          style={[styles.tab, tab === 'archived' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'archived' && styles.tabTextActive]}>
            Archived <Text style={styles.tabCount}>{archivedTasks.length}</Text>
          </Text>
        </Pressable>
      </View>

      {visibleTasks.length > 0 && (
        <View style={styles.toolbar}>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setViewMode('tiles')}
              style={[styles.segBtn, viewMode === 'tiles' && styles.segBtnActive]}
            >
              <Text style={[styles.segBtnText, viewMode === 'tiles' && styles.segBtnTextActive]}>
                ▦
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[styles.segBtn, viewMode === 'list' && styles.segBtnActive]}
            >
              <Text style={[styles.segBtnText, viewMode === 'list' && styles.segBtnTextActive]}>
                ☰
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.sortBtn} onPress={() => setSortMenuOpen(true)}>
            <Text style={styles.sortBtnText}>↕ {sortLabel}</Text>
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
              <Pressable
                style={styles.emptyCta}
                onPress={() => setCreateOpen(true)}
                hitSlop={8}
              >
                <Text style={styles.emptyCtaText}>＋ Create first habit</Text>
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
          visibleTasks.map(task => (
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
                    <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.menuSub}>{opt.sub}</Text>
                  </View>
                  {active && <Text style={styles.menuCheck}>✓</Text>}
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: 12,
      paddingHorizontal: 20,
    },
    headerActions: { flexDirection: 'row', gap: 8 },
    title: { color: c.textPrimary, fontSize: 24, fontWeight: '700' },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      marginBottom: -1,
    },
    tabActive: { borderBottomColor: c.textPrimary },
    tabText: { color: c.textMuted, fontSize: 14, fontWeight: '500' },
    tabTextActive: { color: c.textPrimary, fontWeight: '700' },
    tabCount: { color: c.textFaint, fontSize: 12, fontWeight: '500' },
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
    iconBtnDisabled: { opacity: 0.4 },
    iconText: { color: c.textPrimary, fontSize: 16, fontWeight: '600' },
    iconTextDisabled: { color: c.textFaint },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 10,
    },
    sortBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.elevated,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    sortBtnText: { color: c.textPrimary, fontSize: 13, fontWeight: '600' },
    menuBackdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },
    menuSheet: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.borderDefault,
      paddingVertical: 8,
    },
    menuTitle: {
      color: c.textFaint,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuRowActive: { backgroundColor: c.elevated },
    menuLabel: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    menuLabelActive: { fontWeight: '700' },
    menuSub: { color: c.textFaint, fontSize: 12, marginTop: 2 },
    menuCheck: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.elevated,
      padding: 2,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    segBtn: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    segBtnActive: { backgroundColor: c.elevated3 },
    segBtnText: { color: c.textMuted, fontSize: 20, fontWeight: '500' },
    segBtnTextActive: { color: c.textPrimary, fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
    empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 24 },
    emptyTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
    emptyHint: { color: c.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
    emptyCta: {
      backgroundColor: '#22c55e',
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    emptyCtaText: { color: '#030712', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
    tilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tileWrap: { flexBasis: '48%', flexGrow: 1, maxWidth: '49%' },
    tileSpacer: { flexBasis: '48%', flexGrow: 1 },
  });
}
