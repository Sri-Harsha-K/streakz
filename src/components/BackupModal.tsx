import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv';

export function BackupModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { exportData, exportCsvData } = useAppData();

  const [exportJson, setExportJson] = useState('');
  const [exportCsv, setExportCsv] = useState('');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setExportJson(exportData());
      setExportCsv(exportCsvData());
      setFormat('json');
      setStatus(null);
    }
  }, [visible, exportData, exportCsvData]);

  async function handleCopy() {
    const payload = format === 'json' ? exportJson : exportCsv;
    await Clipboard.setStringAsync(payload);
    setStatus(`Copied ${format.toUpperCase()} to clipboard`);
  }

  const exportText = format === 'json' ? exportJson : exportCsv;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Backup</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeX}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.formatRow}>
              <Pressable
                onPress={() => setFormat('json')}
                style={[styles.formatBtn, format === 'json' && styles.formatBtnActive]}
              >
                <Text style={[styles.formatBtnText, format === 'json' && styles.formatBtnTextActive]}>JSON</Text>
              </Pressable>
              <Pressable
                onPress={() => setFormat('csv')}
                style={[styles.formatBtn, format === 'csv' && styles.formatBtnActive]}
              >
                <Text style={[styles.formatBtnText, format === 'csv' && styles.formatBtnTextActive]}>CSV</Text>
              </Pressable>
            </View>

            <Text style={styles.help}>
              {format === 'json'
                ? 'Copy this JSON and store it safely (notes, cloud drive, password manager, etc.).'
                : 'Copy this CSV for spreadsheet analysis or external reporting.'}
            </Text>
            <View style={styles.codeBox}>
              <ScrollView style={styles.codeScroll} nestedScrollEnabled>
                <Text style={styles.codeText} selectable>
                  {exportText}
                </Text>
              </ScrollView>
            </View>
            <Pressable style={styles.btnPrimary} onPress={handleCopy}>
              <Text style={styles.btnPrimaryText}>Copy {format.toUpperCase()}</Text>
            </Pressable>

            {status && (
              <Text style={[styles.status, { color: '#22c55e' }]}>{status}</Text>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    heading: { color: c.textPrimary, fontSize: 18, fontWeight: '600' },
    closeX: { color: c.textFaint, fontSize: 20, paddingHorizontal: 4 },
    body: { padding: 20, gap: 12 },
    formatRow: {
      flexDirection: 'row',
      gap: 8,
    },
    formatBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.borderDefault,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    formatBtnActive: {
      backgroundColor: c.elevated2,
      borderColor: c.textPrimary,
    },
    formatBtnText: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    formatBtnTextActive: {
      color: c.textPrimary,
    },
    help: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
    codeBox: {
      backgroundColor: c.elevated,
      borderRadius: 10,
      padding: 12,
      maxHeight: 220,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    codeScroll: { flexGrow: 0 },
    codeText: { color: c.textSecondary, fontSize: 11, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
    btnPrimary: {
      backgroundColor: c.textPrimary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnPrimaryText: { color: c.surface, fontSize: 14, fontWeight: '700' },
    status: { fontSize: 13, marginTop: 4 },
  });
}
