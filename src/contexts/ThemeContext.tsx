import React, { createContext, useContext, ReactNode } from 'react';
import { LIGHT_COLORS, DARK_COLORS, LIGHTS_OUT_COLORS, Theme } from '@/theme';
export type { Theme };
import { useSettings } from './SettingsContext';

const PALETTES: Record<string, Theme> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
  'lights-out': LIGHTS_OUT_COLORS,
};

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

  const theme: Theme = PALETTES[settings.theme] ?? LIGHT_COLORS;
  const isDarkMode = settings.theme !== 'light';

  // Geriye dönük uyum için 2 durumlu toggle; 3'lü seçim topbar'daki ThemeToggle'da.
  const toggleDarkMode = () => {
    updateSettings({ theme: isDarkMode ? 'light' : 'dark' });
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
