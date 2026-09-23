import { Platform } from 'react-native';
import {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_700Bold,
} from '@expo-google-fonts/scheherazade-new';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { ArefRuqaa_400Regular, ArefRuqaa_700Bold } from '@expo-google-fonts/aref-ruqaa';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { Lateef_400Regular, Lateef_700Bold } from '@expo-google-fonts/lateef';
import { MarkaziText_400Regular, MarkaziText_700Bold } from '@expo-google-fonts/markazi-text';
import { ReemKufi_400Regular, ReemKufi_700Bold } from '@expo-google-fonts/reem-kufi';
import { ElMessiri_400Regular, ElMessiri_700Bold } from '@expo-google-fonts/el-messiri';
import { Harmattan_400Regular, Harmattan_700Bold } from '@expo-google-fonts/harmattan';
import { Mirza_400Regular, Mirza_700Bold } from '@expo-google-fonts/mirza';
import { Lora_400Regular, Lora_600SemiBold } from '@expo-google-fonts/lora';

export interface ArabicFontOption {
  id: string;
  label: string;
  labelAr: string;
  regularFamily: string;
  boldFamily: string;
  /** false when the font has no Quranic annotation glyphs (waqf/stop marks, sajdah sign, ﴿﴾). */
  hasQuranMarks?: boolean;
}

export const ARABIC_FONT_OPTIONS: ArabicFontOption[] = [
  {
    id: 'scheherazade',
    label: 'Scheherazade New',
    labelAr: 'شهرزاد جديد',
    regularFamily: 'ScheherazadeNew_400Regular',
    boldFamily: 'ScheherazadeNew_700Bold',
  },
  {
    id: 'amiri',
    label: 'Amiri',
    labelAr: 'أميري',
    regularFamily: 'Amiri_400Regular',
    boldFamily: 'Amiri_700Bold',
  },
  {
    id: 'aref-ruqaa',
    label: 'Aref Ruqaa',
    labelAr: 'عارف رقعة',
    regularFamily: 'ArefRuqaa_400Regular',
    boldFamily: 'ArefRuqaa_700Bold',
    hasQuranMarks: false,
  },
  {
    id: 'noto-naskh',
    label: 'Noto Naskh Arabic',
    labelAr: 'نوتو نسخ',
    regularFamily: 'NotoNaskhArabic_400Regular',
    boldFamily: 'NotoNaskhArabic_700Bold',
  },
  {
    id: 'lateef',
    label: 'Lateef',
    labelAr: 'لطيف',
    regularFamily: 'Lateef_400Regular',
    boldFamily: 'Lateef_700Bold',
  },
  {
    id: 'markazi',
    label: 'Markazi Text',
    labelAr: 'مركزي',
    regularFamily: 'MarkaziText_400Regular',
    boldFamily: 'MarkaziText_700Bold',
    hasQuranMarks: false,
  },
  {
    id: 'reem-kufi',
    label: 'Reem Kufi',
    labelAr: 'ريم كوفي',
    regularFamily: 'ReemKufi_400Regular',
    boldFamily: 'ReemKufi_700Bold',
    hasQuranMarks: false,
  },
  {
    id: 'el-messiri',
    label: 'El Messiri',
    labelAr: 'المسيري',
    regularFamily: 'ElMessiri_400Regular',
    boldFamily: 'ElMessiri_700Bold',
    hasQuranMarks: false,
  },
  {
    id: 'harmattan',
    label: 'Harmattan',
    labelAr: 'هرمتان',
    regularFamily: 'Harmattan_400Regular',
    boldFamily: 'Harmattan_700Bold',
  },
  {
    id: 'mirza',
    label: 'Mirza',
    labelAr: 'ميرزا',
    regularFamily: 'Mirza_400Regular',
    boldFamily: 'Mirza_700Bold',
  },
];

export const DEFAULT_ARABIC_FONT_ID = 'scheherazade';
export const DEFAULT_IMAGE_FONT_ID = 'amiri';

// Reading serif for translation ("meal") text, paired against the Arabic fonts above.
export const TRANSLATION_FONT_FAMILY = 'Lora_400Regular';
export const TRANSLATION_FONT_FAMILY_SEMIBOLD = 'Lora_600SemiBold';

// Every font weight bundled by the app, loaded once via expo-font's useFonts() in App.tsx.
export const BUNDLED_FONTS = {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_700Bold,
  Amiri_400Regular,
  Amiri_700Bold,
  ArefRuqaa_400Regular,
  ArefRuqaa_700Bold,
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_700Bold,
  Lateef_400Regular,
  Lateef_700Bold,
  MarkaziText_400Regular,
  MarkaziText_700Bold,
  ReemKufi_400Regular,
  ReemKufi_700Bold,
  ElMessiri_400Regular,
  ElMessiri_700Bold,
  Harmattan_400Regular,
  Harmattan_700Bold,
  Mirza_400Regular,
  Mirza_700Bold,
  Lora_400Regular,
  Lora_600SemiBold,
};

export function getFontOption(id: string): ArabicFontOption {
  return ARABIC_FONT_OPTIONS.find(f => f.id === id) ?? ARABIC_FONT_OPTIONS[0];
}

// Supplies the Quranic marks for fonts that lack them (web only - native has no font stacks).
const QURAN_MARKS_FALLBACK_FONT_ID = 'amiri';

/**
 * Resolves the bundled font-family for a given Arabic font option and weight.
 * On web, fonts without Quranic marks get a fallback family so stop marks still render.
 */
export function getArabicFontFamily(fontOption: ArabicFontOption, bold: boolean = false): string {
  const family = bold ? fontOption.boldFamily : fontOption.regularFamily;
  if (Platform.OS !== 'web' || fontOption.hasQuranMarks !== false) return family;
  const fallback = getFontOption(QURAN_MARKS_FALLBACK_FONT_ID);
  return `"${family}", "${bold ? fallback.boldFamily : fallback.regularFamily}"`;
}
