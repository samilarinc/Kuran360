// Audio file naming format: SSSAAA.mp3 where SSS = surah number, AAA = verse number
export const AUDIO_FILE_FORMAT = (surahNumber: number, verseNumber: number): string => {
  const surah = surahNumber.toString().padStart(3, '0');
  const verse = verseNumber.toString().padStart(3, '0');
  return `${surah}${verse}.mp3`;
};

// Surah introduction audio format: SSS000.mp3
export const SURAH_INTRO_FORMAT = (surahNumber: number): string => {
  const surah = surahNumber.toString().padStart(3, '0');
  return `${surah}000.mp3`;
};

// Colors
export const LIGHT_COLORS = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  accent: '#FFC107',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  headerText: '#FFFFFF',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
} as const;

export const DARK_COLORS = {
  primary: '#56a35aff', // Even lighter green for better contrast
  secondary: '#56a35aff',
  accent: '#FFC107',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0', // Lighter for better visibility
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  headerText: '#FFFFFF',
  cardBackground: '#2D2D2D',
  border: '#404040',
} as const;

// Legacy COLORS export for backward compatibility
export const COLORS = LIGHT_COLORS;

// Font sizes
export const FONT_SIZES = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
  arabic: 24,
  translation: 16,
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
