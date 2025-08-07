import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { StatusBarManager } from './src/components/StatusBarManager';
import { COLORS } from './src/constants';
import { isDataCached } from './src/data/quranData';

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
        <StatusBarManager />
        <AppNavigator isDataAvailable={isDataAvailable} />
      </ThemeProvider>
    </SettingsProvider>
  );
};

export default App;
