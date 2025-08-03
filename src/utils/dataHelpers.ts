import { Surah, Verse } from '../types';
import { AUDIO_FILE_FORMAT } from '../constants';

// Helper function to create a verse
export const createVerse = (
  surahNumber: number,
  number: number,
  arabicText: string,
  translation: string,
  transliteration: string = ''
): Verse => ({
  id: `${surahNumber.toString().padStart(3, '0')}${number.toString().padStart(3, '0')}`,
  surahNumber,
  number,
  arabicText,
  translation,
  transliteration,
  wordTranslations: [],
  audioFileName: AUDIO_FILE_FORMAT(surahNumber, number),
});

// Helper function to create a surah
export const createSurah = (
  number: number,
  name: string,
  arabicName: string,
  englishName: string,
  revelationPlace: string,
  verseCount: number,
  verses: Verse[]
): Surah => ({
  number,
  name,
  arabicName,
  englishName,
  revelationPlace,
  verseCount,
  verses,
});

// Future: You can use this to bulk import verses from a CSV or JSON file
export const importVersesFromData = (csvData: string[][]): Verse[] => {
  return csvData.map(row => createVerse(
    parseInt(row[0]), // surah number
    parseInt(row[1]), // verse number
    row[2], // arabic text
    row[3], // translation
    row[4] || ''  // transliteration
  ));
};

// Example of how to add more surahs
export const ADDITIONAL_SURAHS: Partial<Surah>[] = [
  // You can expand this with more surahs
  {
    number: 3,
    name: 'Al-Imran',
    arabicName: 'آل عمران',
    englishName: 'The Family of Imran',
    revelationPlace: 'Medina',
    verseCount: 200,
    verses: [],
  },
  {
    number: 4,
    name: 'An-Nisa',
    arabicName: 'النساء',
    englishName: 'The Women',
    revelationPlace: 'Medina',
    verseCount: 176,
    verses: [],
  },
];
