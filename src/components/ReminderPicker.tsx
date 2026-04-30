import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { formatHHMM, parseHHMM } from '../utils/reminders';

interface Props {
  value: string | null;
  accent: string;
  onChange: (next: string | null) => void;
}

const PRESETS = ['06:00', '07:00', '08:00', '09:00', '12:00', '18:00', '20:00', '21:00', '22:00'];

export function ReminderPicker({ value, accent, onChange }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [pickerOpen, setPickerOpen] = useState(false);

  const enabled = value !== null;

  function handleToggle() {
    if (enabled) onChange(null);
    else onChange('09:00');
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleToggle}
        style={[
          styles.toggle,
          enabled
            ? { backgroundColor: accent, borderColor: accent }
            : { backgroundColor: 'transparent', borderColor: colors.borderDefault },
        ]}
      >
        <Text style={[styles.toggleText, { color: enabled ? '#030712' : colors.textMuted }]}>
          {enabled ? 'On' : 'Off'}
        </Text>
      </Pressable>

      {enabled && (
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.timeBtn, { borderColor: colors.borderDefault }]}
        >
          <Text style={[styles.timeText, { color: colors.textPrimary }]}>{value}</Text>
          <Text style={[styles.timeHint, { color: colors.textFaint }]}>tap to change</Text>
        </Pressable>
      )}

      <TimePickerModal
        visible={pickerOpen}
        initial={value ?? '09:00'}
        accent={accent}
        onClose={() => setPickerOpen(false)}
        onPick={(picked) => {
          onChange(picked);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

interface TimePickerProps {
  visible: boolean;
  initial: string;
  accent: string;
  onClose: () => void;
  onPick: (time: string) => void;
}

function TimePickerModal({ visible, initial, accent, onClose, onPick }: TimePickerProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      const parsed = parseHHMM(initial);
      if (parsed) {
        setHour(String(parsed.hour).padStart(2, '0'));
        setMinute(String(parsed.minute).padStart(2, '0'));
      }
      setError('');
    }
  }, [visible, initial]);

  function clamp(value: string, max: number): string {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(n)) return '';
    return String(Math.min(max, Math.max(0, n))).padStart(2, '0');
  }

  function handlePreset(p: string) {
    const parsed = parseHHMM(p);
    if (!parsed) return;
    setHour(String(parsed.hour).padStart(2, '0'));
    setMinute(String(parsed.minute).padStart(2, '0'));
  }

  function handleConfirm() {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      setError('Invalid time (00–23 : 00–59)');
      return;
    }
    onPick(formatHHMM(h, m));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.dialog, { borderColor: accent }]} onPress={() => {}}>
          <Text style={styles.title}>Reminder time</Text>
          <Text style={styles.sub}>24-hour</Text>

          <View style={styles.timeInputs}>
            <TextInput
              value={hour}
              onChangeText={(v) => { setHour(v.replace(/\D/g, '').slice(0, 2)); setError(''); }}
              onBlur={() => setHour((h) => clamp(h, 23))}
              keyboardType="number-pad"
              style={[styles.numInput, { borderColor: colors.borderInput }]}
              maxLength={2}
              placeholder="HH"
              placeholderTextColor={colors.textFaint}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              value={minute}
              onChangeText={(v) => { setMinute(v.replace(/\D/g, '').slice(0, 2)); setError(''); }}
              onBlur={() => setMinute((m) => clamp(m, 59))}
              keyboardType="number-pad"
              style={[styles.numInput, { borderColor: colors.borderInput }]}
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={colors.textFaint}
            />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.presetLabel}>Quick picks</Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => handlePreset(p)}
                style={[styles.preset, { borderColor: colors.borderDefault }]}
              >
                <Text style={[styles.presetText, { color: colors.textMuted }]}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.borderDefault, borderWidth: 1, backgroundColor: 'transparent' }]}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={[styles.btn, { backgroundColor: accent }]}>
              <Text style={[styles.btnText, { color: '#030712', fontWeight: '600' }]}>Set</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    toggle: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderRadius: 8,
    },
    toggleText: { fontSize: 13, fontWeight: '600' },
    timeBtn: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderRadius: 8,
    },
    timeText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    timeHint: { fontSize: 11 },

    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },
    dialog: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1.5,
      padding: 22,
    },
    title: { color: c.textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    sub: { color: c.textFaint, fontSize: 11, textAlign: 'center', marginTop: 2, marginBottom: 14 },
    timeInputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    numInput: {
      backgroundColor: c.elevated,
      color: c.textPrimary,
      borderWidth: 1,
      borderRadius: 10,
      width: 70,
      paddingVertical: 10,
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 1,
    },
    colon: { color: c.textPrimary, fontSize: 28, fontWeight: '700' },
    error: { color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: 8 },
    presetLabel: { color: c.textFaint, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 8 },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    preset: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderRadius: 6,
    },
    presetText: { fontSize: 12, fontWeight: '500' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
    btn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { fontSize: 14 },
  });
}
