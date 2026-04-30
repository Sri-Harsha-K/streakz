import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

export const ONBOARDED_KEY = 'streakapp_onboarded';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Page {
  icon: string;
  title: string;
  body: string;
  gradient: [string, string];
}

const PAGES: Page[] = [
  {
    icon: '🎯',
    title: 'Build daily habits',
    body: 'Track routines that matter. Watch your streak grow with every tick.',
    gradient: ['#22c55e', '#16a34a'],
  },
  {
    icon: '🔥',
    title: 'Tick. Streak. Repeat.',
    body: 'Open a habit, mark complete. Each consecutive day adds 1. Miss two days in a row and the streak resets to 0.',
    gradient: ['#f59e0b', '#ea580c'],
  },
  {
    icon: '❄',
    title: 'One free skip',
    body: 'Miss a single day? Your streak survives. The app sends extra reminders the next day so you can finish before midnight.',
    gradient: ['#38bdf8', '#0ea5e9'],
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const width = Dimensions.get('window').width;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    if (idx !== page) setPage(idx);
  }

  async function finish() {
    try {
      await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      // best-effort; if storage fails, user re-sees onboarding next launch
    }
    navigation.replace('Landing');
  }

  function next() {
    if (page < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
    } else {
      finish();
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.brand}>StreakApp</Text>
        {page < PAGES.length - 1 && (
          <Pressable onPress={finish} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.scroll}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={[styles.page, { width }]}>
            <LinearGradient
              colors={p.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Text style={styles.iconText}>{p.icon}</Text>
            </LinearGradient>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Pressable style={styles.cta} onPress={next} hitSlop={8}>
        <Text style={styles.ctaText}>
          {page < PAGES.length - 1 ? 'Next' : 'Get started'}
        </Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    brand: { color: c.textFaint, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    skip: { color: c.textMuted, fontSize: 14, fontWeight: '600' },
    scroll: { flex: 1 },
    page: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    iconCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 36,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    iconText: { fontSize: 64 },
    title: {
      color: c.textPrimary,
      fontSize: 26,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 14,
      letterSpacing: -0.5,
    },
    body: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      maxWidth: 360,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 18,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.elevated2,
    },
    dotActive: {
      width: 22,
      backgroundColor: c.textPrimary,
    },
    cta: {
      marginHorizontal: 24,
      backgroundColor: c.textPrimary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    ctaText: { color: c.surface, fontSize: 16, fontWeight: '700' },
  });
}
