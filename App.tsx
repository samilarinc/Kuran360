import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AudioProvider } from './src/contexts/AudioContext';
import { StatusBarManager } from './src/components/StatusBarManager';
import { COLORS } from './src/constants';
import { isDataCached } from './src/data/quranData';
import { Platform } from 'react-native';

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  useEffect(() => {
    const checkDataAvailability = async () => {
      try {
        const cached = await isDataCached();
        setIsDataAvailable(cached);
        setIsAppReady(true);
      } catch (error) {
        console.error('Error checking data availability:', error);
        setIsDataAvailable(false);
        setIsAppReady(true);
      }
    };

    checkDataAvailability();
  }, []);

  // Web-only: keep document title pinned to 'Kuran360'
  useEffect(() => {
    if (Platform.OS === 'web') {
      const win: any = (globalThis as any).window;
      const doc: any = (globalThis as any).document;
      try {
        if (doc) doc.title = 'Kuran360';
        if (win) {
          const handler = () => { try { if (doc) doc.title = 'Kuran360'; } catch { } };
          win.addEventListener('popstate', handler);
          return () => win.removeEventListener('popstate', handler);
        }
      } catch { }
    }
  }, []);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <ThemeProvider>
        <AudioProvider>
          <StatusBarManager />
          <AppNavigator isDataAvailable={isDataAvailable} />
        </AudioProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
};

export default App;
