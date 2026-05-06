import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Todo, TodoPriority } from '../types/todo';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Icon } from './Icon';
import { formatDisplayDate, today } from '../utils/date';

const HIGH_PRIORITY_COLOR = '#E14545';

interface Props {
  todo: Todo;
  onPress: () => void;
  onToggle: () => void;
  onLongPress?: () => void;
}

export function TodoRow({ todo, onPress, onToggle, onLongPress }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const overdue = !todo.completed && !!todo.dueDate && todo.dueDate < today();
  const priorityColor = priorityChipColor(todo.priority, colors);
  const priorityTextColor = todo.priority === 'normal' ? colors.accentText : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.elevated2 }}
      style={styles.row}
    >
      <Pressable onPress={onToggle} hitSlop={10} style={styles.checkboxWrap}>
        <View
          style={[
            styles.checkbox,
            todo.completed
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : { backgroundColor: 'transparent', borderColor: colors.borderInput },
          ]}
        >
          {todo.completed && <Icon name="check" size={12} color={colors.accentText} stroke={3} />}
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            todo.completed && { color: colors.textFaint, textDecorationLine: 'line-through' },
          ]}
          numberOfLines={1}
        >
          {todo.title}
        </Text>
        {(todo.dueDate || overdue) && (
          <View style={styles.metaRow}>
            {todo.dueDate && (
              <View style={styles.metaItem}>
                <Icon name="calendar" size={11} color={overdue ? HIGH_PRIORITY_COLOR : colors.textFaint} stroke={1.7} />
                <Text style={[styles.metaText, overdue && { color: HIGH_PRIORITY_COLOR }]}>
                  {formatDisplayDate(todo.dueDate)}
                </Text>
              </View>
            )}
            {overdue && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={[styles.priorityChip, { backgroundColor: priorityColor }]}>
        <Text style={[styles.priorityText, { color: priorityTextColor }]}>
          {priorityLabel(todo.priority)}
        </Text>
      </View>
    </Pressable>
  );
}

function priorityLabel(p: TodoPriority): string {
  if (p === 'low') return 'Low';
  if (p === 'high') return 'High';
  return 'Normal';
}

function priorityChipColor(p: TodoPriority, c: ThemeColors): string {
  if (p === 'low') return c.textMuted;
  if (p === 'high') return HIGH_PRIORITY_COLOR;
  return c.accent;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: c.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    checkboxWrap: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flex: 1, minWidth: 0, gap: 4 },
    title: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: c.textFaint, fontSize: 12, fontWeight: '500' },
    overdueBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: 'rgba(225,69,69,0.15)',
    },
    overdueText: { color: HIGH_PRIORITY_COLOR, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    priorityChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    priorityText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  });
}
