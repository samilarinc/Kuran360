import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { LIGHT_COLORS, DARK_COLORS, LIGHTS_OUT_COLORS, Theme } from '@/theme';
import { createCommonStyles, CommonStyles } from '@/theme/common.styles';
export type { Theme, CommonStyles };
import { useSettings } from './SettingsContext';

const PALETTES: Record<string, Theme> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
  'lights-out': LIGHTS_OUT_COLORS,
};

interface ThemeContextType {
  theme: Theme;
  /** Shared style kit for the active theme */
  common: CommonStyles;
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
  const common = useMemo(() => createCommonStyles(theme), [theme]);

  // Geriye dönük uyum için 2 durumlu toggle; 3'lü seçim topbar'daki ThemeToggle'da.
  const toggleDarkMode = () => {
    updateSettings({ theme: isDarkMode ? 'light' : 'dark' });
  };

  const contextValue: ThemeContextType = {
    theme,
    common,
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

/**
 * Memoized per-theme styles. Pass a module-level factory so the memo stays stable:
 * `const styles = useThemedStyles(createStyles);`
 */
export const useThemedStyles = <T,>(factory: (theme: Theme, common: CommonStyles) => T): T => {
  const { theme, common } = useTheme();
  return useMemo(() => factory(theme, common), [factory, theme, common]);
};
