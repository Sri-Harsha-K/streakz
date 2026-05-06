import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { TodoPriority } from '../types/todo';
import { CreateTodoInput } from '../hooks/useTodos';
import { DueDatePicker, PrioritySelector } from './todoFormFields';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: CreateTodoInput) => void;
}

export function CreateTodoModal({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<TodoPriority>('normal');
  const [error, setError] = useState('');

  function reset() {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setPriority('normal');
    setError('');
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError('Title required');
      return;
    }
    onCreate({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
    });
    reset();
    onClose();
  }

  function handleCancel() {
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel} />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 20 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <Text style={styles.heading}>New Todo</Text>
              <Pressable onPress={handleCancel} hitSlop={10}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              autoFocus
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                setError('');
              }}
              placeholder="e.g. Email landlord"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, { borderColor: title ? colors.accent : colors.borderInput }]}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Notes, links, etc."
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.textArea, { borderColor: colors.borderInput }]}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Due date</Text>
            <DueDatePicker value={dueDate} onChange={setDueDate} />

            <Text style={styles.label}>Priority</Text>
            <PrioritySelector value={priority} onChange={setPriority} />

            <View style={styles.actions}>
              <Pressable
                onPress={handleCancel}
                style={[
                  styles.btn,
                  { borderColor: colors.borderDefault, borderWidth: 1, backgroundColor: 'transparent' },
                ]}
              >
                <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmit} style={[styles.btn, { backgroundColor: colors.accent }]}>
                <Text style={[styles.btnText, { color: colors.accentText, fontWeight: '600' }]}>+ Create</Text>
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
