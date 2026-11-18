import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const StatusBarManager: React.FC = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <StatusBar
      barStyle={isDarkMode ? "light-content" : "dark-content"}
      backgroundColor={theme.headerBackground}
      translucent={false}
    />
  );
};
