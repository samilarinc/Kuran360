import type { ThemeName } from '@msarinc/theme-core';

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
  arabicName: string;
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
  theme: ThemeName;
  audioTrackingEnabled: boolean;
  selectedReciter: string;
  playbackRate: number;
  // Audio play behavior
  audioPlayMode: 'nextSurah' | 'loopSurah' | 'stopAtEnd' | 'loopVerse';
  // Font settings
  arabicFont: string;      // font id for Quran reading
  imageArabicFont: string; // font id for image generation
  // Prayer times
  prayerLocation?: {
    id: string;
    cityName: string;
    districtName?: string | null;
  };
  useGPSForPrayer?: boolean;
}

export interface PrayerTime {
  date_index: number;
  miladi: string;
  hicri: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
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

export interface DuaItem {
  id: string;
  person: string;
  topic: string;
  isChecked: boolean;
  isPersonal: boolean;
  createdAt: number;
}

export interface DuaRequest {
  id: string;
  requesterName: string;
  topic: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface UserData {
  bookmarks: Bookmark[];
  lastRead: LastRead[];
  duaList?: DuaItem[];
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

export interface ImageSize {
  id: string;
  name: string;
  displayName: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
  icon: string;
}

export interface ImageGenerationOptions {
  themeMode?: 'light' | 'dark';
  size?: ImageSize;
  arabicFontCss?: string;
  fontScale?: number;
}

export interface HatimPart {
  partNumber: number; // 1-30
  claimedById: string | null;
  claimedByName: string | null;
  isCompleted: boolean;
  claimedAt?: number;
  completedAt?: number;
  pagesRead?: number;
  totalPages?: number;
}

export interface Hatim {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  createdAt: number;
  parts: HatimPart[];
  isCompleted: boolean;
  description?: string;
  deadline?: number;
  isPrivate?: boolean;
  isLocked?: boolean;
}
