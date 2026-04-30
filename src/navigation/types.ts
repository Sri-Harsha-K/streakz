import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Landing: undefined;
  Home: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  TaskDetail: { taskId: string };
};
