export interface WordTranslation {
  arabic: string;
  translation: string;
}

export interface Verse {
  id: string;
  number: number;
  surahNumber: number;
  arabicText: string;
  translation: string;
  transliteration: string;
  wordTranslations: WordTranslation[];
  audioFileName?: string;
}

export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  englishName: string;
  revelationPlace: string;
  verseCount: number;
  verses: Verse[];
}

export interface AudioState {
  isPlaying: boolean;
  currentVerse: Verse | null;
  duration: number;
  position: number;
  isLoading: boolean;
}

export interface QuranData {
  surahs: Surah[];
  totalSurahs: number;
  totalVerses: number;
}
