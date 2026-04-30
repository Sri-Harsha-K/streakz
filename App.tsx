import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppDataProvider, useAppData } from './src/state/AppDataContext';
import { LandingScreen } from './src/screens/LandingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TaskDetailScreen } from './src/screens/TaskDetailScreen';
import { OnboardingScreen, ONBOARDED_KEY } from './src/screens/OnboardingScreen';
import { UndoToast } from './src/components/UndoToast';
import { NotificationActionHandler } from './src/components/NotificationActionHandler';
import { ConfettiHost } from './src/components/ConfettiHost';
import { RootStackParamList } from './src/navigation/types';
import { View, Text } from 'react-native';
import { configureNotifications } from './src/utils/reminders';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

configureNotifications();

const Stack = createNativeStackNavigator<RootStackParamList>();

function NavRoot() {
  const { theme, colors } = useTheme();
  const { loaded } = useAppData();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(!!v))
      .catch(() => setOnboarded(true));
  }, []);

  if (!loaded || onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const navTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: colors.surface, card: colors.card, text: colors.textPrimary, border: colors.borderSubtle, primary: colors.textPrimary },
  } : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.surface, card: colors.card, text: colors.textPrimary, border: colors.borderSubtle, primary: colors.textPrimary },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={onboarded ? 'Landing' : 'Onboarding'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      </Stack.Navigator>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppDataProvider>
          <ConfettiHost>
            <NavRoot />
            <UndoToast />
            <NotificationActionHandler />
          </ConfettiHost>
        </AppDataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
