import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Task } from '../types';
import { hueToAccent } from '../utils/color';
import { TARGET_PRESETS } from '../utils/milestones';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { ReminderPicker } from './ReminderPicker';

interface Props {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (patch: Partial<Pick<Task, 'title' | 'description' | 'color' | 'targetStreak' | 'reminderTime'>>) => void;
}

export function EditTaskModal({ visible, task, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hue, setHue] = useState(152);
  const [targetStreak, setTargetStreak] = useState(30);
  const [customTarget, setCustomTarget] = useState('');
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [error, setError] = useState('');

  const accent = hueToAccent(hue);

  useEffect(() => {
    if (visible && task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setHue(task.color);
      setTargetStreak(task.targetStreak);
      setCustomTarget((TARGET_PRESETS as readonly number[]).includes(task.targetStreak) ? '' : String(task.targetStreak));
      setReminderTime(task.reminderTime ?? null);
      setError('');
    }
  }, [visible, task]);

  function handleCustomTarget(val: string) {
    setCustomTarget(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1) setTargetStreak(n);
  }

  function handlePreset(p: number) {
    setTargetStreak(p);
    setCustomTarget('');
  }

  function handleSubmit() {
    if (!task) return;
    if (!title.trim()) { setError('Title required'); return; }
    if (targetStreak < 1) { setError('Target ≥ 1'); return; }
    if (targetStreak < task.currentStreak) {
      setError(`Target below current streak (${task.currentStreak}d)`);
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      color: hue,
      targetStreak,
      reminderTime,
    });
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 + insets.bottom }} keyboardShouldPersistTaps="handled">
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Edit Habit</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={t => { setTitle(t); setError(''); }}
              placeholder="e.g. Morning run"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, { borderColor: title ? accent : colors.borderInput }]}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Run 20+ min"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.textArea, { borderColor: colors.borderInput }]}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>
              Target streak <Text style={[styles.targetVal, { color: accent }]}>{targetStreak}d</Text>
            </Text>
            <View style={styles.presets}>
              {TARGET_PRESETS.map(p => {
                const active = targetStreak === p && !customTarget;
                return (
                  <Pressable
                    key={p}
                    onPress={() => handlePreset(p)}
                    style={[
                      styles.preset,
                      active
                        ? { backgroundColor: accent, borderColor: accent }
                        : { backgroundColor: 'transparent', borderColor: colors.borderDefault },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: active ? '#030712' : colors.textMuted },
                      ]}
                    >
                      {p}d
                    </Text>
                  </Pressable>
                );
              })}
              <TextInput
                value={customTarget}
                onChangeText={handleCustomTarget}
                placeholder="custom"
                placeholderTextColor={colors.textFaint}
                keyboardType="numeric"
                style={[styles.customInput, { borderColor: colors.borderInput }]}
              />
            </View>

            <Text style={styles.label}>Daily reminder</Text>
            <ReminderPicker value={reminderTime} accent={accent} onChange={setReminderTime} />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              <View style={[styles.swatch, { backgroundColor: accent }]} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={359}
                step={1}
                value={hue}
                onValueChange={setHue}
                minimumTrackTintColor={accent}
                maximumTrackTintColor={colors.elevated2}
                thumbTintColor={accent}
              />
              <Text style={styles.hueNum}>{hue}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={[styles.btn, { borderColor: colors.borderDefault, borderWidth: 1, backgroundColor: 'transparent' }]}
              >
                <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                style={[styles.btn, { backgroundColor: accent }]}
              >
                <Text style={[styles.btnText, { color: '#030712', fontWeight: '600' }]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: c.borderDefault,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    heading: { color: c.textPrimary, fontSize: 18, fontWeight: '600' },
    closeX: { color: c.textFaint, fontSize: 20, paddingHorizontal: 4 },
    label: { color: c.textMuted, fontSize: 13, marginTop: 12, marginBottom: 6 },
    targetVal: { fontWeight: '600' },
    input: {
      backgroundColor: c.elevated,
      color: c.textPrimary,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
    },
    textArea: { minHeight: 56, textAlignVertical: 'top' },
    error: { color: '#f87171', fontSize: 12, marginTop: 4 },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    preset: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderRadius: 6,
    },
    presetText: { fontSize: 12, fontWeight: '500' },
    customInput: {
      backgroundColor: c.elevated,
      color: c.textSecondary,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 12,
      width: 80,
    },
    colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    swatch: { width: 32, height: 32, borderRadius: 8 },
    slider: { flex: 1, height: 40 },
    hueNum: { color: c.textFaint, fontSize: 12, width: 32, textAlign: 'right' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { fontSize: 14 },
  });
}
