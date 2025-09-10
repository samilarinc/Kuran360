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
  favoriteTranslation: string; // Favori meal
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

export interface Bookmark {
  id: string;
  surahNumber: number;
  verseNumber: number;
  surahName: string;
  verseText: string;
  createdAt: number;
  note?: string;
}

export interface LastRead {
  surahNumber: number;
  verseNumber: number;
  surahName: string;
  verseText: string;
  timestamp: number;
  url: string;
}

export interface UserData {
  bookmarks: Bookmark[];
  lastRead: LastRead[];
}

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  updatedAt: number;
}

// Social/forum types
export interface VerseMention {
  surahNumber: number;
  verseNumber: number;
}

export interface Thread {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  title: string;
  body: string;
  mentions: VerseMention[];
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch
  replyCount: number;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  body: string;
  mentions: VerseMention[];
  createdAt: number; // ms epoch
}

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  availableTranslations: string[];
  availableReciters: { id: string; name: string; folder: string }[];
}

export interface ShareOptions {
  platform?: 'twitter' | 'whatsapp' | 'facebook' | 'instagram' | 'telegram' | 'generic';
  title?: string;
  message?: string;
  url?: string;
}

export interface VerseShareData {
  arabicText: string;
  translation: string;
  surahName: string;
  verseNumber: number;
  surahNumber: number;
}
