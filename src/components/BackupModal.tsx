import { useEffect, useState } from 'react';
import {
  Alert,
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
import * as Clipboard from 'expo-clipboard';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'export' | 'import';

export function BackupModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { exportData, importData } = useAppData();

  const [tab, setTab] = useState<Tab>('export');
  const [exportJson, setExportJson] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setExportJson(exportData());
      setImportText('');
      setStatus(null);
      setTab('export');
    }
  }, [visible, exportData]);

  async function handleCopy() {
    await Clipboard.setStringAsync(exportJson);
    setStatus({ kind: 'ok', msg: 'Copied to clipboard' });
  }

  async function handlePaste() {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setImportText(text);
      setStatus(null);
    }
  }

  function runImport(mode: 'replace' | 'merge') {
    if (!importText.trim()) {
      setStatus({ kind: 'err', msg: 'Paste backup JSON first' });
      return;
    }
    if (mode === 'replace') {
      Alert.alert(
        'Replace all data?',
        'This wipes current habits and replaces them with the backup. Cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: () => doImport('replace') },
        ],
      );
    } else {
      doImport('merge');
    }
  }

  function doImport(mode: 'replace' | 'merge') {
    const result = importData(importText, mode);
    if (result.ok) {
      setStatus({
        kind: 'ok',
        msg: `${mode === 'replace' ? 'Replaced' : 'Merged'}: ${result.counts.tasks} habits, ${result.counts.completions} completions`,
      });
      setImportText('');
    } else {
      setStatus({ kind: 'err', msg: result.error });
    }
  }

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

          <View style={styles.tabs}>
            <Pressable
              onPress={() => { setTab('export'); setStatus(null); }}
              style={[styles.tab, tab === 'export' && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === 'export' && styles.tabTextActive]}>Export</Text>
            </Pressable>
            <Pressable
              onPress={() => { setTab('import'); setStatus(null); }}
              style={[styles.tab, tab === 'import' && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === 'import' && styles.tabTextActive]}>Import</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {tab === 'export' ? (
              <>
                <Text style={styles.help}>
                  Copy this JSON. Save in notes/email/cloud drive. To restore, paste under Import.
                </Text>
                <View style={styles.codeBox}>
                  <ScrollView style={styles.codeScroll} nestedScrollEnabled>
                    <Text style={styles.codeText} selectable>
                      {exportJson}
                    </Text>
                  </ScrollView>
                </View>
                <Pressable style={styles.btnPrimary} onPress={handleCopy}>
                  <Text style={styles.btnPrimaryText}>Copy to clipboard</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.help}>
                  Paste backup JSON. Merge keeps both sets (by id), Replace wipes current data.
                </Text>
                <TextInput
                  value={importText}
                  onChangeText={(v) => { setImportText(v); setStatus(null); }}
                  placeholder='{ "version": 1, "data": { ... } }'
                  placeholderTextColor={colors.textFaint}
                  multiline
                  style={styles.textArea}
                />
                <View style={styles.row}>
                  <Pressable style={styles.btnGhost} onPress={handlePaste}>
                    <Text style={styles.btnGhostText}>Paste</Text>
                  </Pressable>
                  <Pressable style={styles.btnGhost} onPress={() => runImport('merge')}>
                    <Text style={styles.btnGhostText}>Merge</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btnPrimary, { flex: 1 }]}
                    onPress={() => runImport('replace')}
                  >
                    <Text style={styles.btnPrimaryText}>Replace</Text>
                  </Pressable>
                </View>
              </>
            )}

            {status && (
              <Text
                style={[
                  styles.status,
                  { color: status.kind === 'ok' ? '#22c55e' : '#f87171' },
                ]}
              >
                {status.msg}
              </Text>
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
    tabs: {
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
    body: { padding: 20, gap: 12 },
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
    textArea: {
      backgroundColor: c.elevated,
      color: c.textPrimary,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 10,
      padding: 12,
      minHeight: 140,
      maxHeight: 220,
      fontSize: 12,
      textAlignVertical: 'top',
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    },
    row: { flexDirection: 'row', gap: 10 },
    btnPrimary: {
      backgroundColor: c.textPrimary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnPrimaryText: { color: c.surface, fontSize: 14, fontWeight: '700' },
    btnGhost: {
      flex: 1,
      backgroundColor: c.elevated2,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnGhostText: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    status: { fontSize: 13, marginTop: 4 },
  });
}
