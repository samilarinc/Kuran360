import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { COLORS } from './src/constants';

const App: React.FC = () => {
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
