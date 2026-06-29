export interface ArabicFontOption {
  id: string;
  label: string;
  labelAr: string;
  css: string;           // CSS font-family string
  googleFonts: string;   // Google Fonts family param
}

export const ARABIC_FONT_OPTIONS: ArabicFontOption[] = [
  {
    id: 'scheherazade',
    label: 'Scheherazade New',
    labelAr: 'شهرزاد جديد',
    css: '"Scheherazade New", serif',
    googleFonts: 'Scheherazade+New:wght@400;700',
  },
  {
    id: 'amiri',
    label: 'Amiri',
    labelAr: 'أميري',
    css: 'Amiri, serif',
    googleFonts: 'Amiri:ital,wght@0,400;0,700;1,400',
  },
  {
    id: 'aref-ruqaa',
    label: 'Aref Ruqaa',
    labelAr: 'عارف رقعة',
    css: '"Aref Ruqaa", serif',
    googleFonts: 'Aref+Ruqaa:wght@400;700',
  },
  {
    id: 'noto-naskh',
    label: 'Noto Naskh Arabic',
    labelAr: 'نوتو نسخ',
    css: '"Noto Naskh Arabic", serif',
    googleFonts: 'Noto+Naskh+Arabic:wght@400;700',
  },
  {
    id: 'lateef',
    label: 'Lateef',
    labelAr: 'لطيف',
    css: 'Lateef, serif',
    googleFonts: 'Lateef:wght@400;700',
  },
  {
    id: 'markazi',
    label: 'Markazi Text',
    labelAr: 'مركزي',
    css: '"Markazi Text", serif',
    googleFonts: 'Markazi+Text:wght@400;500;600;700',
  },
  {
    id: 'reem-kufi',
    label: 'Reem Kufi',
    labelAr: 'ريم كوفي',
    css: '"Reem Kufi", serif',
    googleFonts: 'Reem+Kufi:wght@400;500;600;700',
  },
  {
    id: 'el-messiri',
    label: 'El Messiri',
    labelAr: 'المسيري',
    css: '"El Messiri", sans-serif',
    googleFonts: 'El+Messiri:wght@400;500;600;700',
  },
  {
    id: 'harmattan',
    label: 'Harmattan',
    labelAr: 'هرمتان',
    css: 'Harmattan, serif',
    googleFonts: 'Harmattan:wght@400;700',
  },
  {
    id: 'mirza',
    label: 'Mirza',
    labelAr: 'ميرزا',
    css: 'Mirza, serif',
    googleFonts: 'Mirza:wght@400;700',
  },
];

export const DEFAULT_ARABIC_FONT_ID = 'scheherazade';
export const DEFAULT_IMAGE_FONT_ID = 'amiri';

export function getFontOption(id: string): ArabicFontOption {
  return ARABIC_FONT_OPTIONS.find(f => f.id === id) ?? ARABIC_FONT_OPTIONS[0];
}

export function loadGoogleFont(fontOption: ArabicFontOption): void {
  if (typeof document === 'undefined') return;
  const linkId = `gfont-${fontOption.id}`;
  if (document.getElementById(linkId)) return; // already loaded
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontOption.googleFonts}&display=swap`;
  document.head.appendChild(link);
}
