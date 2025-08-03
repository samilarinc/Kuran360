export interface WordTranslation {
  arabic: string;
  turkish: string;
}

export interface Verse {
  id: string;
  surahNumber: number;
  verseNumber: number;
  arabicText: string;
  turkishTranslation: string;
  transliteration: string;
  wordTranslations: WordTranslation[];
  audioFileName: string;
}

export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  numberOfVerses: number;
  isMeccan: boolean;
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
}
