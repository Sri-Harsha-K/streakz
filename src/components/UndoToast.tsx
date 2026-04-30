import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { hueToAccent } from '../utils/color';

export function UndoToast() {
  const { recentCompletion, allTasks, undoTodayCompletion, dismissRecentCompletion } = useAppData();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const visible = !!recentCompletion;
  const task = recentCompletion ? allTasks.find(t => t.id === recentCompletion.taskId) : null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 180 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 20,
        duration: visible ? 180 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  if (!task) {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wrap,
          { opacity, transform: [{ translateY }], bottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      />
    );
  }

  const accent = hueToAccent(task.color);
  const themeStyles = makeStyles(colors);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        { opacity, transform: [{ translateY }], bottom: Math.max(insets.bottom, 16) + 16 },
      ]}
    >
      <View style={themeStyles.toast}>
        <View style={[themeStyles.dot, { backgroundColor: accent }]} />
        <Text style={themeStyles.text} numberOfLines={1}>
          {task.title} +1
        </Text>
        <Pressable
          onPress={() => undoTodayCompletion(task.id)}
          hitSlop={8}
          style={themeStyles.undoBtn}
        >
          <Text style={[themeStyles.undoText, { color: accent }]}>UNDO</Text>
        </Pressable>
        <Pressable onPress={dismissRecentCompletion} hitSlop={8} style={themeStyles.closeBtn}>
          <Text style={themeStyles.closeText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
});

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.elevated3,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      maxWidth: 420,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    text: { flex: 1, color: c.textPrimary, fontSize: 14, fontWeight: '500' },
    undoBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    undoText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    closeBtn: { paddingHorizontal: 4, paddingVertical: 4 },
    closeText: { color: c.textFaint, fontSize: 14 },
  });
}
