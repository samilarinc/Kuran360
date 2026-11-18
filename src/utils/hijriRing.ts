// Look of the moon-ring view of the Hijri calendar: its own night palettes, fonts and star field.

export type HijriPalette = {
    bg: string; bgRadial: string; bgGlow: string;
    text: string; muted: string; gold: string; goldSoft: string;
    moonIvory: string; moonDark: string;
    line: string; panel: string; panelBorder: string;
    glowRGB: string;
};

/** Dark theme: "Midnight Emerald" */
export const EMERALD: HijriPalette = {
    bg: '#0c2c1f',
    bgRadial: 'radial-gradient(125% 120% at 50% 16%, #14402e 0%, #0c2c1f 42%, #06180f 74%, #040f0a 100%)',
    bgGlow: 'rgba(20,64,46,0.6)',
    text: '#e8ebd2', muted: '#9cb8a6', gold: '#d8b24c', goldSoft: '#bd9a3f',
    moonIvory: '#edefdb', moonDark: '#05150d',
    line: 'rgba(216,178,76,0.28)', panel: 'rgba(6,23,15,0.74)', panelBorder: 'rgba(216,178,76,0.36)',
    glowRGB: '216,178,76',
};

/** Light theme: "Lapis" night sky */
export const LAPIS: HijriPalette = {
    bg: '#101d4a',
    bgRadial: 'radial-gradient(125% 120% at 50% 16%, #1d2f69 0%, #122152 40%, #0a1336 72%, #060b22 100%)',
    bgGlow: 'rgba(29,47,105,0.6)',
    text: '#ece4cc', muted: '#9bacd4', gold: '#e6c570', goldSoft: '#cbab5e',
    moonIvory: '#ece2c7', moonDark: '#0b1535',
    line: 'rgba(220,184,86,0.30)', panel: 'rgba(11,20,52,0.74)', panelBorder: 'rgba(220,184,86,0.38)',
    glowRGB: '230,197,112',
};

/**
 * Bundled families (BUNDLED_FONTS), so the ring looks the same on web and native.
 * Each weight is its own family: Android drops a custom family when asked for another fontWeight.
 */
export const RING_FONT = {
    calligraphy: 'ArefRuqaa_700Bold',
    naskh: 'Amiri_400Regular',
    naskhBold: 'Amiri_700Bold',
    latin: 'Lora_400Regular',
    latinBold: 'Lora_600SemiBold',
};

/** Arabic weekday names, Sunday first (Date.getDay order) */
export const WEEKDAYS_AR = ['الأحَد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخَميس', 'الجُمعة', 'السَّبت'];

/** Eastern Arabic digits */
export const toArabicDigits = (n: number) => String(Math.round(n)).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);

/** Drag progress stops of the month carousel (-1 = previous month centered, 1 = next) */
export const DRAG_STOPS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
/** Months drawn by the carousel, relative to the one shown */
export const CAROUSEL_OFFSETS = [-1, 0, 1];

export const STARS = Array.from({ length: 54 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.5 + 0.4, base: Math.random() * 0.5 + 0.2,
}));
