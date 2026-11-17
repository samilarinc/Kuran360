import type { Palette, ThemeName } from '@msarinc/ui';
import { FONT_SIZES as BASE_FONT_SIZES } from '@msarinc/theme-core';
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

export interface Theme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    error: string;
    warning: string;
    /** Text and icons drawn on a primary-colored fill (buttons, badges, audio bar) */
    headerText: string;
    /** App header bar: sits on the page color so the screen's own content carries the color */
    headerBackground: string;
    headerForeground: string;
    cardBackground: string;
    border: string;
    /** Ink-green icons on page/card backgrounds; lighter than primary in dark mode so icons stand out */
    iconPrimary: string;
    /** The one bold block on a screen (main menu "Surahs"): deep green fill with gilded icon */
    featured: string;
    featuredBorder: string;
    featuredText: string;
    featuredMuted: string;
    featuredIcon: string;
    featuredIconBackground: string;
}

// Palette: ink green (mushaf binding) + gilding gold, on a paper tone in light and a binding tone in dark
export const LIGHT_COLORS: Theme = {
    primary: '#1E4A38', // ink green
    secondary: '#2F6B52',
    accent: '#966B22', // gilding
    background: '#EEF0EA', // paper
    surface: '#FAFBF7',
    text: '#1B2420',
    textSecondary: '#5D6862',
    success: '#2F7A4F',
    error: '#B3261E',
    warning: '#B7791F',
    headerText: '#FFFFFF',
    headerBackground: '#EEF0EA',
    headerForeground: '#1E4A38',
    cardBackground: '#FAFBF7',
    border: '#DADFD6',
    iconPrimary: '#1E4A38',
    featured: '#1E4A38',
    featuredBorder: '#1E4A38',
    featuredText: '#F4F1E6',
    featuredMuted: '#B9CBBF',
    featuredIcon: '#E3C27E',
    featuredIconBackground: '#2C5E49',
};

export const LIGHTS_OUT_COLORS: Theme = {
    primary: '#3F7A60', // dimmed so it doesn't glare on pure black
    secondary: '#3F7A60',
    accent: '#B8913F', // gilding, dimmed for pure black
    background: '#000000',
    surface: '#0A0A0A',
    text: '#D8D8DC', // softened instead of pure white to reduce eye strain
    textSecondary: '#8E8E93',
    success: '#3E8E45',
    error: '#C4453D',
    warning: '#C08A2E',
    headerText: '#D8D8DC',
    headerBackground: '#000000',
    headerForeground: '#D8D8DC',
    cardBackground: '#000000',
    border: '#3A3A3C', // #1A1A1A was too close to the black background to be seen
    iconPrimary: '#5E9C80',
    featured: '#0F2A20',
    featuredBorder: '#1F3D31',
    featuredText: '#D8D8DC',
    featuredMuted: '#8E8E93',
    featuredIcon: '#B8913F',
    featuredIconBackground: '#183A2D',
};

export const DARK_COLORS: Theme = {
    primary: '#4E8A70', // works both as a fill under white text (4:1) and as text on the dark page (4.4:1)
    secondary: '#5E9C80',
    accent: '#D2A857', // gilding
    background: '#0E1512', // binding green-black
    surface: '#16201B',
    text: '#E6EAE5',
    textSecondary: '#9AA69F',
    success: '#5FAE78',
    error: '#E5675E',
    warning: '#D9A441',
    headerText: '#FFFFFF',
    headerBackground: '#0E1512',
    headerForeground: '#E6EAE5',
    cardBackground: '#1C2822',
    border: '#2A3731',
    iconPrimary: '#7FB096',
    featured: '#173B2D',
    featuredBorder: '#2A5241',
    featuredText: '#E6EAE5',
    featuredMuted: '#9FBCAD',
    featuredIcon: '#D2A857',
    featuredIconBackground: '#21503D',
};

export { SPACING, RADIUS } from '@msarinc/theme-core';

export const FONT_SIZES = {
    ...BASE_FONT_SIZES,
    arabic: 24,
    translation: 16,
} as const;

// Tafsir accent: the verse's tafsir button, the main menu entry and the settings section
export const TAFSIR_COLOR = '#0EA5E9';

/** The app's colors in @msarinc/ui's palette shape, so library components (header toggles, menus) match the app. */
const toLibraryPalette = (theme: Theme): Palette => ({
    background: theme.background,
    text: theme.text,
    textMuted: theme.textSecondary,
    primary: theme.primary,
    primaryHover: theme.secondary,
    surface: theme.cardBackground,
    border: theme.border,
    header: theme.headerBackground,
    danger: theme.error,
    white: '#FFFFFF',
});

export const LIBRARY_PALETTES: Record<ThemeName, Palette> = {
    light: toLibraryPalette(LIGHT_COLORS),
    dark: toLibraryPalette(DARK_COLORS),
    'lights-out': toLibraryPalette(LIGHTS_OUT_COLORS),
};
