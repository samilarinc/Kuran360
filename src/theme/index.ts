
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
    headerText: string;
    cardBackground: string;
    border: string;
}

// Colors
export const LIGHT_COLORS: Theme = {
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
};

export const LIGHTS_OUT_COLORS: Theme = {
    primary: '#356B3B', // Saf siyah zeminde göz almasın diye koyulaştırıldı
    secondary: '#356B3B',
    accent: '#D6A000', // FFC107 saf siyahta göz aldığı için hafif karartıldı
    background: '#000000',
    surface: '#0A0A0A',
    text: '#D8D8DC', // Saf beyaz yerine hafif karartılmış, göz yormasın diye
    textSecondary: '#8E8E93',
    success: '#3E8E45',
    error: '#C4453D',
    warning: '#D6A000',
    headerText: '#D8D8DC',
    cardBackground: '#000000',
    border: '#3A3A3C', // #1A1A1A siyah zemine (#000000/cardBackground) çok yakındı, hiç görünmüyordu
};

export const DARK_COLORS: Theme = {
    primary: '#56A35A', // Valid hex color - light green
    secondary: '#56A35A',
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
};

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
