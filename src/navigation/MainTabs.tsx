import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LandingScreen } from '../screens/LandingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainTabParamList } from './types';
import { TabBar } from './TabBar';
import { useTheme } from '../theme/ThemeContext';
import { View } from 'react-native';

const Tabs = createMaterialTopTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
    <Tabs.Navigator
      tabBar={(props) => <TabBar {...props} />}
      tabBarPosition="bottom"
      initialRouteName="Landing"
      style={{ backgroundColor: colors.surface }}
      screenOptions={{ swipeEnabled: true, animationEnabled: true }}
    >
      <Tabs.Screen name="Landing" component={LandingScreen} />
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
    </View>
  );
}
