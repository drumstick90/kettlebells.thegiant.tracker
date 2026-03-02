import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { LiveWorkoutScreen } from '../screens/LiveWorkoutScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CreditsScreen } from '../screens/CreditsScreen';
import { VictoryTestScreen } from '../screens/VictoryTestScreen';
import type { RootStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const colors = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.surfaceSoft,
      card: colors.surfaceBase,
      text: colors.ink800,
      border: colors.borderSoft,
      primary: colors.ink800,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceBase },
          headerTintColor: colors.ink800,
          headerTitleStyle: { fontWeight: '500' },
          contentStyle: { backgroundColor: colors.surfaceSoft } as const,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'The Giant' }} />
        <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Setup Session' }} />
        <Stack.Screen name="LiveWorkout" component={LiveWorkoutScreen} options={{ title: 'Live Workout', gestureEnabled: false }} />
        <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} options={{ title: 'Session Summary', gestureEnabled: false }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Credits" component={CreditsScreen} options={{ title: 'Credits' }} />
        <Stack.Screen name="VictoryTest" component={VictoryTestScreen} options={{ title: 'Victory Test' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
