import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { ProfileProvider, useProfile } from './src/context/ProfileContext';
import { ProfileSelectScreen } from './src/screens/ProfileSelectScreen';
import { StorageProvider } from './src/context/StorageContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { activeProfile, isLoading, setActiveProfile } = useProfile();

  if (isLoading) {
    return null;
  }

  if (!activeProfile) {
    return (
      <ProfileSelectScreen
        onSelect={async (profile) => {
          await setActiveProfile(profile);
        }}
      />
    );
  }

  return (
    <StorageProvider profile={activeProfile}>
      <RootNavigator />
    </StorageProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ProfileProvider>
          <SafeAreaProvider>
            <AppContent />
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </ProfileProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
