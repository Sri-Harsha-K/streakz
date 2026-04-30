import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../components/Icon';
import { useTheme } from '../theme/ThemeContext';

const TABS: Record<string, { label: string; icon: IconName }> = {
  Landing: { label: 'Today', icon: 'home' },
  Home: { label: 'Habits', icon: 'list' },
  Settings: { label: 'Settings', icon: 'gear' },
  Profile: { label: 'Profile', icon: 'user' },
};

export function TabBar({ state, navigation }: MaterialTopTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, idx) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === idx;
          const tint = focused ? colors.accent : colors.textMuted;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name as never);
                }
              }}
              style={styles.tab}
              hitSlop={6}
            >
              <Icon name={meta.icon} size={24} color={tint} stroke={focused ? 2 : 1.6} />
              <Text style={[styles.label, { color: tint, fontWeight: focused ? '600' : '500' }]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(_c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    bar: {
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      paddingHorizontal: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    label: { fontSize: 11, letterSpacing: 0.1 },
  });
}
