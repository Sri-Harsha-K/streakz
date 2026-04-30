import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { hueToAccent } from '../utils/color';
import { getNextMilestones } from '../utils/milestones';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface Props {
  visible: boolean;
  hue: number;
  currentTarget: number;
  onExtend: (newTarget: number) => void;
  onArchive: () => void;
  onDismiss: () => void;
}

export function MilestoneModal({ visible, hue, currentTarget, onExtend, onArchive, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const accent = hueToAccent(hue);
  const [opt1, opt2] = getNextMilestones(currentTarget);

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, { opacity }]}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={[styles.dialog, { borderColor: accent }]} onPress={() => {}}>
          <View style={[styles.trophyWrap, { backgroundColor: accent }]}>
            <Text style={styles.trophy}>★</Text>
          </View>

          <Text style={styles.title}>{currentTarget}-day target hit!</Text>
          <Text style={styles.body}>
            You've completed your goal. Extend the streak or archive this habit.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btnPrimary, { backgroundColor: accent }]}
              onPress={() => onExtend(opt1)}
            >
              <Text style={styles.btnPrimaryText}>Extend → {opt1}d</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, { backgroundColor: accent, opacity: 0.85 }]}
              onPress={() => onExtend(opt2)}
            >
              <Text style={styles.btnPrimaryText}>Extend → {opt2}d</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={onArchive}>
              <Text style={styles.btnGhostText}>Archive habit</Text>
            </Pressable>
          </View>

          <Pressable style={styles.dismissRow} onPress={onDismiss} hitSlop={6}>
            <Text style={styles.dismissText}>Decide later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
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
      borderRadius: 20,
      borderWidth: 1.5,
      padding: 24,
      alignItems: 'center',
    },
    trophyWrap: {
      width: 56, height: 56,
      borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    trophy: { fontSize: 28, color: '#030712', fontWeight: '700' },
    title: { color: c.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
    body: { color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
    actions: { width: '100%', gap: 8, marginTop: 18 },
    btnPrimary: {
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnPrimaryText: { color: '#030712', fontSize: 14, fontWeight: '700' },
    btnGhost: {
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: c.elevated2,
      alignItems: 'center',
    },
    btnGhostText: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    dismissRow: { marginTop: 14, padding: 4 },
    dismissText: { color: c.textFaint, fontSize: 12 },
  });
}
