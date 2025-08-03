import { Surah, Verse } from '../types';
import { AUDIO_FILE_FORMAT } from '../constants';

// Helper function to create a verse
export const createVerse = (
  surahNumber: number,
  verseNumber: number,
  arabicText: string,
  turkishTranslation: string
): Verse => ({
  surahNumber,
  verseNumber,
  arabicText,
  turkishTranslation,
  audioFileName: AUDIO_FILE_FORMAT(surahNumber, verseNumber),
});

// Helper function to create a surah
export const createSurah = (
  number: number,
  name: string,
  arabicName: string,
  numberOfVerses: number,
  isMeccan: boolean,
  verses: Verse[]
): Surah => ({
  number,
  name,
  arabicName,
  numberOfVerses,
  isMeccan,
  verses,
});

// Future: You can use this to bulk import verses from a CSV or JSON file
export const importVersesFromData = (csvData: string[][]): Verse[] => {
  return csvData.map(row => createVerse(
    parseInt(row[0]), // surah number
    parseInt(row[1]), // verse number
    row[2], // arabic text
    row[3]  // turkish translation
  ));
};

// Example of how to add more surahs
export const ADDITIONAL_SURAHS: Partial<Surah>[] = [
  // You can expand this with more surahs
  {
    number: 3,
    name: 'Al-Imran',
    arabicName: 'آل عمران',
    numberOfVerses: 200,
    isMeccan: false,
    // verses would be added here
  },
  {
    number: 4,
    name: 'An-Nisa',
    arabicName: 'النساء',
    numberOfVerses: 176,
    isMeccan: false,
    // verses would be added here
  }
];
