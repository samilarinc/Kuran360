import React, { createContext, useContext, ReactNode } from 'react';
import { LIGHT_COLORS, DARK_COLORS, Theme } from '../theme';
export type { Theme };
import { useSettings } from './SettingsContext';



interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useSettings();

  const theme: Theme = settings.darkMode ? DARK_COLORS : LIGHT_COLORS;
  const isDarkMode = settings.darkMode;

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const contextValue: ThemeContextType = {
    theme,
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
