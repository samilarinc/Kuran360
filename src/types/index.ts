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
  allTranslations?: Record<string, string>; // All available translations
}

export interface Surah {
  number: number;
  name: string;
  turkishName?: string;
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

export interface AppSettings {
  selectedTranslations: string[];
  autoplayEnabled: boolean;
  showTransliteration: boolean;
  showWordTranslations: boolean;
  inlineWordTranslations: boolean;
  usePaginatedView: boolean;
  darkMode: boolean;
  audioTrackingEnabled: boolean;
  selectedReciter: string;
  playbackRate: number;
  // Audio play behavior
  audioPlayMode: 'nextSurah' | 'loopSurah' | 'stopAtEnd' | 'loopVerse';
}

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  availableTranslations: string[];
  availableReciters: { id: string; name: string; folder: string }[];
}
