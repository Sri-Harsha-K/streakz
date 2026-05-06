import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { TodoPriority } from '../types/todo';
import { addDays, today } from '../utils/date';

const HIGH_PRIORITY_COLOR = '#E14545';
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface PrioritySelectorProps {
  value: TodoPriority;
  onChange: (next: TodoPriority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const options: Array<{ id: TodoPriority; label: string; color: string; textColor: string }> = [
    { id: 'low', label: 'Low', color: colors.textMuted, textColor: '#FFFFFF' },
    { id: 'normal', label: 'Normal', color: colors.accent, textColor: colors.accentText },
    { id: 'high', label: 'High', color: HIGH_PRIORITY_COLOR, textColor: '#FFFFFF' },
  ];
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[
              styles.priorityChip,
              active
                ? { backgroundColor: opt.color, borderColor: opt.color }
                : { backgroundColor: 'transparent', borderColor: colors.borderDefault },
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                { color: active ? opt.textColor : colors.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface DueDatePickerProps {
  value: string | null;
  onChange: (next: string | null) => void;
}

export function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const todayStr = today();
  const tomorrowStr = addDays(todayStr, 1);
  const nextWeekStr = addDays(todayStr, 7);

  const presets: Array<{ id: string; label: string; value: string | null }> = [
    { id: 'none', label: 'None', value: null },
    { id: 'today', label: 'Today', value: todayStr },
    { id: 'tomorrow', label: 'Tomorrow', value: tomorrowStr },
    { id: 'week', label: '+1 week', value: nextWeekStr },
  ];

  function handleManualChange(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }
    if (ISO_DATE_RE.test(trimmed)) {
      onChange(trimmed);
    } else {
      onChange(trimmed);
    }
  }

  const manualValue = value ?? '';
  const matchesPreset = presets.some((p) => p.value === value);

  return (
    <View style={styles.dateColumn}>
      <View style={styles.row}>
        {presets.map((p) => {
          const active = value === p.value;
          return (
            <Pressable
              key={p.id}
              onPress={() => onChange(p.value)}
              style={[
                styles.preset,
                active
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { backgroundColor: 'transparent', borderColor: colors.borderDefault },
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: active ? colors.accentText : colors.textMuted },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={manualValue}
        onChangeText={handleManualChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          {
            borderColor: !matchesPreset && value && ISO_DATE_RE.test(value) ? colors.accent : colors.borderInput,
          },
        ]}
      />
      {!!value && !ISO_DATE_RE.test(value) && (
        <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
      )}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    dateColumn: { gap: 8 },
    priorityChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderRadius: 8,
    },
    priorityText: { fontSize: 13, fontWeight: '600' },
    preset: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderRadius: 6,
    },
    presetText: { fontSize: 12, fontWeight: '500' },
    input: {
      backgroundColor: c.elevated,
      color: c.textPrimary,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      width: 160,
    },
    hint: { color: c.textFaint, fontSize: 11 },
  });
}
