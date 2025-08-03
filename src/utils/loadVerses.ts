import { promises as fs } from 'fs';
import { Verse } from '../types';

export interface VerseData {
  surah_number: number;
  verse_number: number;
  url: string;
  arabic_text: string;
  transliteration: string;
  word_translations: Array<{
    arabic: string;
    turkish: string;
  }>;
  translations: Record<string, string>;
}

export async function loadAllVerses(): Promise<Map<string, VerseData>> {
  const versesMap = new Map<string, VerseData>();
  
  try {
    const versesDir = '/home/samil/quran/QuranApp/verses';
    const files = await fs.readdir(versesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = `${versesDir}/${file}`;
        const content = await fs.readFile(filePath, 'utf-8');
        const verseData: VerseData = JSON.parse(content);
        
        // Use surah:verse format as key
        const key = `${verseData.surah_number.toString().padStart(3, '0')}${verseData.verse_number.toString().padStart(3, '0')}`;
        versesMap.set(key, verseData);
      }
    }
  } catch (error) {
    console.error('Error loading verses:', error);
  }
  
  return versesMap;
}

export function convertToAppFormat(verseData: VerseData, selectedTranslation: string = 'Diyanet İşleri Meali (Yeni)'): Verse {
  return {
    id: `${verseData.surah_number.toString().padStart(3, '0')}${verseData.verse_number.toString().padStart(3, '0')}`,
    surahNumber: verseData.surah_number,
    verseNumber: verseData.verse_number,
    arabicText: verseData.arabic_text,
    turkishTranslation: verseData.translations[selectedTranslation] || Object.values(verseData.translations)[0] || '',
    transliteration: verseData.transliteration,
    wordTranslations: verseData.word_translations,
    audioFileName: `${verseData.surah_number.toString().padStart(3, '0')}${verseData.verse_number.toString().padStart(3, '0')}.mp3`
  };
}
