import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { COLORS } from './src/constants';
import { loadAllVerses } from './src/data/quranData';

const App: React.FC = () => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadAllVerses();
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Error loading verse data:', error);
        // Still set to true to show the app, data will be loaded on demand
        setIsDataLoaded(true);
      }
    };

    initializeData();
  }, []);

  if (!isDataLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      <AppNavigator />
    </SettingsProvider>
  );
};

export default App;
