import { useMemo, useState } from 'react';
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
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useTodoData } from '../state/TodoContext';
import { Icon } from '../components/Icon';
import { TodoRow } from '../components/TodoRow';
import { CreateTodoModal } from '../components/CreateTodoModal';
import { EditTodoModal } from '../components/EditTodoModal';
import { Todo, TodoPriority } from '../types/todo';
import { MAX_ACTIVE_TODOS } from '../hooks/useTodos';

type TabMode = 'active' | 'completed';
type SortMode = 'created' | 'due' | 'priority' | 'alpha';

const SORT_OPTIONS: Array<{ id: SortMode; label: string; sub: string }> = [
  { id: 'created', label: 'Created', sub: 'Order added' },
  { id: 'due', label: 'Due date', sub: 'Earliest first' },
  { id: 'priority', label: 'Priority', sub: 'High first' },
  { id: 'alpha', label: 'A–Z', sub: 'Title' },
];

const PRIORITY_RANK: Record<TodoPriority, number> = { high: 0, normal: 1, low: 2 };

export function TodosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const {
    activeTodos,
    completedTodos,
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
  } = useTodoData();

  const [tab, setTab] = useState<TabMode>('active');
  const [sortMode, setSortMode] = useState<SortMode>('created');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const baseTodos = tab === 'active' ? activeTodos : completedTodos;
  const visibleTodos = useMemo(() => sortTodos(baseTodos, sortMode), [baseTodos, sortMode]);
  const atCap = activeTodos.length >= MAX_ACTIVE_TODOS;
  const sortLabel = SORT_OPTIONS.find((o) => o.id === sortMode)?.label ?? 'Sort';

  function handleSortChange(next: SortMode) {
    setSortMode(next);
    setSortMenuOpen(false);
  }

  function handleDelete(todo: Todo) {
    Alert.alert(
      'Delete todo?',
      `Remove "${todo.title}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTodo(todo.id);
            setEditingTodo(null);
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Todos</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => setSortMenuOpen(true)} hitSlop={6}>
            <Icon name="sort" size={16} color={colors.textMuted} stroke={1.7} />
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
        <Pressable onPress={() => setTab('active')} style={[styles.tab, tab === 'active' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</Text>
          <Text style={styles.tabCount}>{activeTodos.length}</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('completed')}
          style={[styles.tab, tab === 'completed' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>Completed</Text>
          <Text style={styles.tabCount}>{completedTodos.length}</Text>
        </Pressable>
      </View>

      {visibleTodos.length > 0 && (
        <View style={styles.toolbar}>
          <View />
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
        {visibleTodos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'No todos yet' : 'No completed todos'}
            </Text>
            <Text style={styles.emptyHint}>
              {tab === 'active'
                ? 'Capture one-shot tasks. Knock them off.'
                : 'Todos you finish will show up here.'}
            </Text>
            {tab === 'active' && (
              <Pressable style={styles.emptyCta} onPress={() => setCreateOpen(true)} hitSlop={8}>
                <Icon name="plus" size={16} color={colors.accentText} stroke={2.2} />
                <Text style={styles.emptyCtaText}>Add todo</Text>
              </Pressable>
            )}
          </View>
        ) : (
          visibleTodos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onPress={() => setEditingTodo(todo)}
              onToggle={() => toggleComplete(todo.id)}
              onLongPress={() => setEditingTodo(todo)}
            />
          ))
        )}
      </ScrollView>

      <CreateTodoModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createTodo}
      />

      <EditTodoModal
        visible={!!editingTodo}
        todo={editingTodo}
        onClose={() => setEditingTodo(null)}
        onSave={(patch) => editingTodo && updateTodo(editingTodo.id, patch)}
        onDelete={() => editingTodo && handleDelete(editingTodo)}
      />

      <Modal
        visible={sortMenuOpen}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
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

function sortTodos(todos: readonly Todo[], mode: SortMode): Todo[] {
  const arr = [...todos];
  switch (mode) {
    case 'due':
      return arr.sort((a, b) => {
        const ad = a.dueDate;
        const bd = b.dueDate;
        if (ad && bd) {
          if (ad === bd) return a.title.localeCompare(b.title);
          return ad.localeCompare(bd);
        }
        if (ad && !bd) return -1;
        if (!ad && bd) return 1;
        return a.title.localeCompare(b.title);
      });
    case 'priority':
      return arr.sort((a, b) => {
        const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (diff !== 0) return diff;
        return a.title.localeCompare(b.title);
      });
    case 'alpha':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
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
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },
    menuSheet: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
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
  });
}
