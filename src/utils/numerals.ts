const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export type VerseNumberStyle = 'latin' | 'arabic';

export const formatVerseNumber = (value: number, style: VerseNumberStyle): string => {
  const latin = String(value);
  if (style !== 'arabic') return latin;
  return latin.replace(/[0-9]/g, digit => ARABIC_INDIC_DIGITS[Number(digit)]);
};
