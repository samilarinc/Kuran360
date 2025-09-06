import { QuranData, Surah, Verse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Remove the direct import of allVerses.json to reduce bundle size
// import allVerses from './allVerses.json';

interface VerseData {
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

// Cross-platform storage utility with IndexedDB for web and AsyncStorage for mobile
const Storage = {
  // IndexedDB helper for web
  async openDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      const globalObj = globalThis as any;
      if (!globalObj.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = globalObj.indexedDB.open('QuranApp', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        const db = await this.openDB();
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');

        return new Promise((resolve, reject) => {
          const request = store.get(key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : null);
          };
        });
      } catch (error) {
        console.warn('IndexedDB failed, trying localStorage chunks:', error);
        // Fallback to chunked localStorage
        return await this.getItemFromChunks(key);
      }
    } else {
      return await AsyncStorage.getItem(key);
    }
  },

  // Read chunked data from localStorage
  async getItemFromChunks(key: string): Promise<string | null> {
    const globalObj = globalThis as any;
    if (!globalObj.localStorage) return null;

    // Check if this is chunked data
    const chunkInfo = globalObj.localStorage.getItem(`${key}_chunks`);
    if (chunkInfo) {
      const { count } = JSON.parse(chunkInfo);
      let result = '';
      for (let i = 0; i < count; i++) {
        const chunk = globalObj.localStorage.getItem(`${key}_${i}`);
        if (!chunk) return null;
        result += chunk;
      }
      return result;
    }

    // Regular single item
    return globalObj.localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const db = await this.openDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        return new Promise((resolve, reject) => {
          const request = store.put({ key, value });
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.warn('IndexedDB failed, using localStorage chunking:', error);
        // Fallback to localStorage with chunking
        await this.setItemWithChunking(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  // Fallback chunking method for localStorage
  async setItemWithChunking(key: string, value: string): Promise<void> {
    const globalObj = globalThis as any;
    if (!globalObj.localStorage) return;

    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for safety

    // Clear any existing chunks
    const existingChunkInfo = globalObj.localStorage.getItem(`${key}_chunks`);
    if (existingChunkInfo) {
      const { count } = JSON.parse(existingChunkInfo);
      for (let i = 0; i < count; i++) {
        globalObj.localStorage.removeItem(`${key}_${i}`);
      }
    }

    // Save in chunks
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    logger.debug(`📦 Chunking data into ${chunks} smaller chunks of 1MB each`);

    for (let i = 0; i < chunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, value.length);
      const chunk = value.slice(start, end);
      try {
        globalObj.localStorage.setItem(`${key}_${i}`, chunk);
      } catch (error) {
        throw new Error(`Failed to save chunk ${i}: ${error}`);
      }
    }

    // Save chunk info
    globalObj.localStorage.setItem(`${key}_chunks`, JSON.stringify({ count: chunks }));
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const db = await this.openDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(undefined);
        });
      } catch (error) {
        // Also clean up localStorage chunks as fallback
        const globalObj = globalThis as any;
        if (globalObj.localStorage) {
          const chunkInfo = globalObj.localStorage.getItem(`${key}_chunks`);
          if (chunkInfo) {
            const { count } = JSON.parse(chunkInfo);
            for (let i = 0; i < count; i++) {
              globalObj.localStorage.removeItem(`${key}_${i}`);
            }
            globalObj.localStorage.removeItem(`${key}_chunks`);
          }
          globalObj.localStorage.removeItem(key);
        }
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
};

// Global cache for verse data
let allVersesCache: VerseData[] | null = null;
const VERSES_CACHE_KEY = 'quran_verses_data';
const VERSES_VERSION_KEY = 'quran_verses_version';
const CURRENT_VERSION = '2.0'; // Increment this when you update the verses data

// Check if data is cached without loading it
export const isDataCached = async (): Promise<boolean> => {
  try {
    const cachedVersion = await Storage.getItem(VERSES_VERSION_KEY);
    if (cachedVersion !== CURRENT_VERSION) {
      return false;
    }

    // Quick check if data exists
    const cachedData = await Storage.getItem(VERSES_CACHE_KEY);
    return !!cachedData;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
};

// Progress callback type
export type ProgressCallback = (progress: number, status: string) => void;

// Function to load verses data from static file or localStorage
// Load all verses data into memory and localStorage
export const loadAllVerses = async (progressCallback?: ProgressCallback): Promise<void> => {
  logger.debug('📚 loadAllVerses called - allVersesCache exists:', !!allVersesCache, 'cache length:', allVersesCache?.length || 0);

  if (allVersesCache && allVersesCache.length > 0) {
    logger.debug('✅ Data already loaded, returning early');
    progressCallback?.(100, 'Veri zaten yüklü');
    return;
  }

  try {
    progressCallback?.(10, 'Cache kontrol ediliyor...');

    // Check localStorage first
    logger.debug('🔍 Checking localStorage cache...');
    const cachedData = await Storage.getItem(VERSES_CACHE_KEY);
    const cachedVersion = await Storage.getItem(VERSES_VERSION_KEY);

    logger.debug('📦 Cache status:', {
      hasCachedData: !!cachedData,
      cachedDataLength: cachedData ? cachedData.length : 0,
      cachedVersion,
      currentVersion: CURRENT_VERSION,
      versionMatch: cachedVersion === CURRENT_VERSION
    });

    if (cachedData && cachedVersion === CURRENT_VERSION) {
      progressCallback?.(50, 'Cache\'ten yükleniyor...');
      logger.debug('🚀 Loading from cache...');
      allVersesCache = JSON.parse(cachedData);
      logger.debug('✅ Cache loaded successfully, verses count:', allVersesCache!.length);
      progressCallback?.(100, 'Tamamlandı!');
      return;
    }

    // Clear old cache if version mismatch
    if (cachedData && cachedVersion !== CURRENT_VERSION) {
      progressCallback?.(20, 'Eski cache temizleniyor...');
      logger.debug('🧹 Clearing old cache due to version mismatch');
      await Storage.removeItem(VERSES_CACHE_KEY);
      await Storage.removeItem(VERSES_VERSION_KEY);
    }

    // Load from server if no cache or version mismatch
    progressCallback?.(30, 'Sunucudan indiriliyor...');
    logger.debug('📡 Loading from server...');
    const response = await fetch('/allVerses.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    progressCallback?.(60, 'Veri işleniyor...');
    const data = await response.json();
    logger.debug('📥 Data loaded from server, size:', JSON.stringify(data).length);

    // Convert object to array if needed
    const versesArray = Array.isArray(data) ? data : Object.values(data);

    allVersesCache = versesArray;

    progressCallback?.(80, 'Cache\'e kaydediliyor...');
    logger.debug('💾 Saving to cache...');
    try {
      // Cache the data
      await Storage.setItem(VERSES_CACHE_KEY, JSON.stringify(versesArray));
      await Storage.setItem(VERSES_VERSION_KEY, CURRENT_VERSION);
      logger.debug('✅ Data cached successfully, verses count:', versesArray.length);
      progressCallback?.(100, 'Başarıyla tamamlandı!');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache data, but continuing with loaded data:', cacheError);
      progressCallback?.(100, 'İndirme tamamlandı (cache kaydedilemedi)');
      // Continue without caching - data is still loaded in memory
    }

  } catch (error) {
    console.error('❌ Error loading verses:', error);
    progressCallback?.(0, 'Hata oluştu: ' + (error as Error).message);
    throw error;
  }
};

// Convert JSON verse data to our app format
function convertToAppFormat(verseData: VerseData): Verse {
  const verseId = `${verseData.surah_number.toString().padStart(3, '0')}${verseData.verse_number.toString().padStart(3, '0')}`;

  return {
    id: verseId,
    number: verseData.verse_number,
    surahNumber: verseData.surah_number,
    arabicText: verseData.arabic_text,
    translation: verseData.translations?.['Diyanet İşleri Meali (Yeni)'] ||
      verseData.translations?.['Elmalılı Hamdi Yazır Meali'] ||
      verseData.translations?.['Süleyman Ateş Meali'] ||
      Object.values(verseData.translations || {})[0] ||
      'Translation not available',
    transliteration: verseData.transliteration || '',
    wordTranslations: (verseData.word_translations || []).map(wt => ({
      arabic: wt.arabic,
      translation: wt.turkish
    })),
    allTranslations: verseData.translations || {}
  };
}

// Function to load a single verse from the loaded verses data
async function requireVerse(surahNumber: number, verseNumber: number): Promise<VerseData | null> {
  // Ensure data is loaded
  await loadAllVerses();

  if (!allVersesCache || !Array.isArray(allVersesCache)) {
    console.error('allVersesCache is not available:', allVersesCache);
    return null;
  }

  // Find the verse in the array
  const verse = allVersesCache.find((v: VerseData) =>
    v.surah_number === surahNumber && v.verse_number === verseNumber
  );

  return verse || null;
}

// Complete Surah metadata (all 114 surahs) with Turkish names
const SURAH_METADATA = [
  { number: 1, name: 'Fatiha', turkishName: 'Fatiha', arabicName: 'الْفَاتِحَة', englishName: 'The Opening', revelationPlace: 'Mekkî', verseCount: 7 },
  { number: 2, name: 'Bakara', turkishName: 'Bakara', arabicName: 'الْبَقَرَة', englishName: 'The Cow', revelationPlace: 'Medenî', verseCount: 286 },
  { number: 3, name: 'Al-i İmran', turkishName: 'Al-i İmran', arabicName: 'آل عِمْرَان', englishName: 'The Family of Imran', revelationPlace: 'Medenî', verseCount: 200 },
  { number: 4, name: 'Nisa', turkishName: 'Nisa', arabicName: 'النِّسَاء', englishName: 'The Women', revelationPlace: 'Medenî', verseCount: 176 },
  { number: 5, name: 'Maide', turkishName: 'Maide', arabicName: 'الْمَائِدَة', englishName: 'The Table Spread', revelationPlace: 'Medenî', verseCount: 120 },
  { number: 6, name: 'Enam', turkishName: 'Enam', arabicName: 'الْأَنْعَام', englishName: 'The Cattle', revelationPlace: 'Mekkî', verseCount: 165 },
  { number: 7, name: 'Araf', turkishName: 'Araf', arabicName: 'الْأَعْرَاف', englishName: 'The Heights', revelationPlace: 'Mekkî', verseCount: 206 },
  { number: 8, name: 'Enfal', turkishName: 'Enfal', arabicName: 'الْأَنْفَال', englishName: 'The Spoils of War', revelationPlace: 'Medenî', verseCount: 75 },
  { number: 9, name: 'Tevbe', turkishName: 'Tevbe', arabicName: 'التَّوْبَة', englishName: 'The Repentance', revelationPlace: 'Medenî', verseCount: 129 },
  { number: 10, name: 'Yunus', turkishName: 'Yunus', arabicName: 'يُونُس', englishName: 'Jonah', revelationPlace: 'Mekkî', verseCount: 109 },
  { number: 11, name: 'Hud', turkishName: 'Hud', arabicName: 'هُود', englishName: 'Hud', revelationPlace: 'Mekkî', verseCount: 123 },
  { number: 12, name: 'Yusuf', turkishName: 'Yusuf', arabicName: 'يُوسُف', englishName: 'Joseph', revelationPlace: 'Mekkî', verseCount: 111 },
  { number: 13, name: 'Rad', turkishName: 'Rad', arabicName: 'الرَّعْد', englishName: 'The Thunder', revelationPlace: 'Medenî', verseCount: 43 },
  { number: 14, name: 'İbrahim', turkishName: 'İbrahim', arabicName: 'إِبْرَاهِيم', englishName: 'Abraham', revelationPlace: 'Mekkî', verseCount: 52 },
  { number: 15, name: 'Hicr', turkishName: 'Hicr', arabicName: 'الْحِجْر', englishName: 'The Rocky Tract', revelationPlace: 'Mekkî', verseCount: 99 },
  { number: 16, name: 'Nahl', turkishName: 'Nahl', arabicName: 'النَّحْل', englishName: 'The Bee', revelationPlace: 'Mekkî', verseCount: 128 },
  { number: 17, name: 'İsra', turkishName: 'İsra', arabicName: 'الْإِسْرَاء', englishName: 'The Night Journey', revelationPlace: 'Mekkî', verseCount: 111 },
  { number: 18, name: 'Kehf', turkishName: 'Kehf', arabicName: 'الْكَهْف', englishName: 'The Cave', revelationPlace: 'Mekkî', verseCount: 110 },
  { number: 19, name: 'Meryem', turkishName: 'Meryem', arabicName: 'مَرْيَم', englishName: 'Mary', revelationPlace: 'Mekkî', verseCount: 98 },
  { number: 20, name: 'Taha', turkishName: 'Taha', arabicName: 'طه', englishName: 'Ta-Ha', revelationPlace: 'Mekkî', verseCount: 135 },
  { number: 21, name: 'Enbiya', turkishName: 'Enbiya', arabicName: 'الْأَنْبِيَاء', englishName: 'The Prophets', revelationPlace: 'Mekkî', verseCount: 112 },
  { number: 22, name: 'Hac', turkishName: 'Hac', arabicName: 'الْحَجّ', englishName: 'The Pilgrimage', revelationPlace: 'Medenî', verseCount: 78 },
  { number: 23, name: 'Muminun', turkishName: 'Muminun', arabicName: 'الْمُؤْمِنُون', englishName: 'The Believers', revelationPlace: 'Mekkî', verseCount: 118 },
  { number: 24, name: 'Nur', turkishName: 'Nur', arabicName: 'النُّور', englishName: 'The Light', revelationPlace: 'Medenî', verseCount: 64 },
  { number: 25, name: 'Furkan', turkishName: 'Furkan', arabicName: 'الْفُرْقَان', englishName: 'The Criterion', revelationPlace: 'Mekkî', verseCount: 77 },
  { number: 26, name: 'Şuara', turkishName: 'Şuara', arabicName: 'الشُّعَرَاء', englishName: 'The Poets', revelationPlace: 'Mekkî', verseCount: 227 },
  { number: 27, name: 'Neml', turkishName: 'Neml', arabicName: 'النَّمْل', englishName: 'The Ant', revelationPlace: 'Mekkî', verseCount: 93 },
  { number: 28, name: 'Kasas', turkishName: 'Kasas', arabicName: 'الْقَصَص', englishName: 'The Stories', revelationPlace: 'Mekkî', verseCount: 88 },
  { number: 29, name: 'Ankebut', turkishName: 'Ankebut', arabicName: 'الْعَنْكَبُوت', englishName: 'The Spider', revelationPlace: 'Mekkî', verseCount: 69 },
  { number: 30, name: 'Rum', turkishName: 'Rum', arabicName: 'الرُّوم', englishName: 'The Romans', revelationPlace: 'Mekkî', verseCount: 60 },
  { number: 31, name: 'Lokman', turkishName: 'Lokman', arabicName: 'لُقْمَان', englishName: 'Luqman', revelationPlace: 'Mekkî', verseCount: 34 },
  { number: 32, name: 'Secde', turkishName: 'Secde', arabicName: 'السَّجْدَة', englishName: 'The Prostration', revelationPlace: 'Mekkî', verseCount: 30 },
  { number: 33, name: 'Ahzab', turkishName: 'Ahzab', arabicName: 'الْأَحْزَاب', englishName: 'The Clans', revelationPlace: 'Medenî', verseCount: 73 },
  { number: 34, name: 'Sebe', turkishName: 'Sebe', arabicName: 'سَبَأ', englishName: 'Sheba', revelationPlace: 'Mekkî', verseCount: 54 },
  { number: 35, name: 'Fatır', turkishName: 'Fatır', arabicName: 'فَاطِر', englishName: 'Originator', revelationPlace: 'Mekkî', verseCount: 45 },
  { number: 36, name: 'Yasin', turkishName: 'Yasin', arabicName: 'يس', englishName: 'Ya Sin', revelationPlace: 'Mekkî', verseCount: 83 },
  { number: 37, name: 'Saffat', turkishName: 'Saffat', arabicName: 'الصَّافَّات', englishName: 'Those Who Set The Ranks', revelationPlace: 'Mekkî', verseCount: 182 },
  { number: 38, name: 'Sad', turkishName: 'Sad', arabicName: 'ص', englishName: 'The Letter Sad', revelationPlace: 'Mekkî', verseCount: 88 },
  { number: 39, name: 'Zümer', turkishName: 'Zümer', arabicName: 'الزُّمَر', englishName: 'The Troops', revelationPlace: 'Mekkî', verseCount: 75 },
  { number: 40, name: 'Mümin', turkishName: 'Mümin', arabicName: 'غَافِر', englishName: 'The Forgiver', revelationPlace: 'Mekkî', verseCount: 85 },
  { number: 41, name: 'Fussilet', turkishName: 'Fussilet', arabicName: 'فُصِّلَت', englishName: 'Explained In Detail', revelationPlace: 'Mekkî', verseCount: 54 },
  { number: 42, name: 'Şura', turkishName: 'Şura', arabicName: 'الشُّورَى', englishName: 'The Consultation', revelationPlace: 'Mekkî', verseCount: 53 },
  { number: 43, name: 'Zuhruf', turkishName: 'Zuhruf', arabicName: 'الزُّخْرُف', englishName: 'The Ornaments Of Gold', revelationPlace: 'Mekkî', verseCount: 89 },
  { number: 44, name: 'Duhan', turkishName: 'Duhan', arabicName: 'الدُّخَان', englishName: 'The Smoke', revelationPlace: 'Mekkî', verseCount: 59 },
  { number: 45, name: 'Casiye', turkishName: 'Casiye', arabicName: 'الْجَاثِيَة', englishName: 'The Crouching', revelationPlace: 'Mekkî', verseCount: 37 },
  { number: 46, name: 'Ahkaf', turkishName: 'Ahkaf', arabicName: 'الْأَحْقَاف', englishName: 'The Wind-Curved Sandhills', revelationPlace: 'Mekkî', verseCount: 35 },
  { number: 47, name: 'Muhammed', turkishName: 'Muhammed', arabicName: 'مُحَمَّد', englishName: 'Muhammad', revelationPlace: 'Medenî', verseCount: 38 },
  { number: 48, name: 'Fetih', turkishName: 'Fetih', arabicName: 'الْفَتْح', englishName: 'The Victory', revelationPlace: 'Medenî', verseCount: 29 },
  { number: 49, name: 'Hucurat', turkishName: 'Hucurat', arabicName: 'الْحُجُرَات', englishName: 'The Rooms', revelationPlace: 'Medenî', verseCount: 18 },
  { number: 50, name: 'Kaf', turkishName: 'Kaf', arabicName: 'ق', englishName: 'The Letter Qaf', revelationPlace: 'Mekkî', verseCount: 45 },
  { number: 51, name: 'Zariyat', turkishName: 'Zariyat', arabicName: 'الذَّارِيَات', englishName: 'The Winnowing Winds', revelationPlace: 'Mekkî', verseCount: 60 },
  { number: 52, name: 'Tur', turkishName: 'Tur', arabicName: 'الطُّور', englishName: 'The Mount', revelationPlace: 'Mekkî', verseCount: 49 },
  { number: 53, name: 'Necm', turkishName: 'Necm', arabicName: 'النَّجْم', englishName: 'The Star', revelationPlace: 'Mekkî', verseCount: 62 },
  { number: 54, name: 'Kamer', turkishName: 'Kamer', arabicName: 'الْقَمَر', englishName: 'The Moon', revelationPlace: 'Mekkî', verseCount: 55 },
  { number: 55, name: 'Rahman', turkishName: 'Rahman', arabicName: 'الرَّحْمَن', englishName: 'The Beneficent', revelationPlace: 'Medenî', verseCount: 78 },
  { number: 56, name: 'Vakia', turkishName: 'Vakia', arabicName: 'الْوَاقِعَة', englishName: 'The Inevitable', revelationPlace: 'Mekkî', verseCount: 96 },
  { number: 57, name: 'Hadid', turkishName: 'Hadid', arabicName: 'الْحَدِيد', englishName: 'The Iron', revelationPlace: 'Medenî', verseCount: 29 },
  { number: 58, name: 'Mücadele', turkishName: 'Mücadele', arabicName: 'الْمُجَادَلَة', englishName: 'The Pleading Woman', revelationPlace: 'Medenî', verseCount: 22 },
  { number: 59, name: 'Haşr', turkishName: 'Haşr', arabicName: 'الْحَشْر', englishName: 'The Exile', revelationPlace: 'Medenî', verseCount: 24 },
  { number: 60, name: 'Mümtehine', turkishName: 'Mümtehine', arabicName: 'الْمُمْتَحَنَة', englishName: 'She That Is To Be Examined', revelationPlace: 'Medenî', verseCount: 13 },
  { number: 61, name: 'Saff', turkishName: 'Saff', arabicName: 'الصَّف', englishName: 'The Ranks', revelationPlace: 'Medenî', verseCount: 14 },
  { number: 62, name: 'Cuma', turkishName: 'Cuma', arabicName: 'الْجُمُعَة', englishName: 'The Congregation', revelationPlace: 'Medenî', verseCount: 11 },
  { number: 63, name: 'Münafikun', turkishName: 'Münafikun', arabicName: 'الْمُنَافِقُون', englishName: 'The Hypocrites', revelationPlace: 'Medenî', verseCount: 11 },
  { number: 64, name: 'Teğabün', turkishName: 'Teğabün', arabicName: 'التَّغَابُن', englishName: 'The Mutual Disillusion', revelationPlace: 'Medenî', verseCount: 18 },
  { number: 65, name: 'Talak', turkishName: 'Talak', arabicName: 'الطَّلَاق', englishName: 'The Divorce', revelationPlace: 'Medenî', verseCount: 12 },
  { number: 66, name: 'Tahrim', turkishName: 'Tahrim', arabicName: 'التَّحْرِيم', englishName: 'The Prohibition', revelationPlace: 'Medenî', verseCount: 12 },
  { number: 67, name: 'Mülk', turkishName: 'Mülk', arabicName: 'الْمُلْك', englishName: 'The Sovereignty', revelationPlace: 'Mekkî', verseCount: 30 },
  { number: 68, name: 'Kalem', turkishName: 'Kalem', arabicName: 'الْقَلَم', englishName: 'The Pen', revelationPlace: 'Mekkî', verseCount: 52 },
  { number: 69, name: 'Hakka', turkishName: 'Hakka', arabicName: 'الْحَاقَّة', englishName: 'The Reality', revelationPlace: 'Mekkî', verseCount: 52 },
  { number: 70, name: 'Mearic', turkishName: 'Mearic', arabicName: 'الْمَعَارِج', englishName: 'The Ascending Stairways', revelationPlace: 'Mekkî', verseCount: 44 },
  { number: 71, name: 'Nuh', turkishName: 'Nuh', arabicName: 'نُوح', englishName: 'Noah', revelationPlace: 'Mekkî', verseCount: 28 },
  { number: 72, name: 'Cin', turkishName: 'Cin', arabicName: 'الْجِنّ', englishName: 'The Jinn', revelationPlace: 'Mekkî', verseCount: 28 },
  { number: 73, name: 'Müzzemmil', turkishName: 'Müzzemmil', arabicName: 'الْمُزَّمِّل', englishName: 'The Enshrouded One', revelationPlace: 'Mekkî', verseCount: 20 },
  { number: 74, name: 'Müddessir', turkishName: 'Müddessir', arabicName: 'الْمُدَّثِّر', englishName: 'The Cloaked One', revelationPlace: 'Mekkî', verseCount: 56 },
  { number: 75, name: 'Kıyamet', turkishName: 'Kıyamet', arabicName: 'الْقِيَامَة', englishName: 'The Resurrection', revelationPlace: 'Mekkî', verseCount: 40 },
  { number: 76, name: 'İnsan', turkishName: 'İnsan', arabicName: 'الْإِنْسَان', englishName: 'The Human', revelationPlace: 'Medenî', verseCount: 31 },
  { number: 77, name: 'Mürselat', turkishName: 'Mürselat', arabicName: 'الْمُرْسَلَات', englishName: 'The Emissaries', revelationPlace: 'Mekkî', verseCount: 50 },
  { number: 78, name: 'Nebe', turkishName: 'Nebe', arabicName: 'النَّبَأ', englishName: 'The Tidings', revelationPlace: 'Mekkî', verseCount: 40 },
  { number: 79, name: 'Naziat', turkishName: 'Naziat', arabicName: 'النَّازِعَات', englishName: 'Those Who Drag Forth', revelationPlace: 'Mekkî', verseCount: 46 },
  { number: 80, name: 'Abese', turkishName: 'Abese', arabicName: 'عَبَسَ', englishName: 'He Frowned', revelationPlace: 'Mekkî', verseCount: 42 },
  { number: 81, name: 'Tekvir', turkishName: 'Tekvir', arabicName: 'التَّكْوِير', englishName: 'The Overthrowing', revelationPlace: 'Mekkî', verseCount: 29 },
  { number: 82, name: 'İnfitar', turkishName: 'İnfitar', arabicName: 'الْإِنْفِطَار', englishName: 'The Cleaving', revelationPlace: 'Mekkî', verseCount: 19 },
  { number: 83, name: 'Mutaffifin', turkishName: 'Mutaffifin', arabicName: 'الْمُطَفِّفِين', englishName: 'The Defrauding', revelationPlace: 'Mekkî', verseCount: 36 },
  { number: 84, name: 'İnşikak', turkishName: 'İnşikak', arabicName: 'الْإِنْشِقَاق', englishName: 'The Sundering', revelationPlace: 'Mekkî', verseCount: 25 },
  { number: 85, name: 'Buruc', turkishName: 'Buruc', arabicName: 'الْبُرُوج', englishName: 'The Mansions Of The Stars', revelationPlace: 'Mekkî', verseCount: 22 },
  { number: 86, name: 'Tarık', turkishName: 'Tarık', arabicName: 'الطَّارِق', englishName: 'The Morning Star', revelationPlace: 'Mekkî', verseCount: 17 },
  { number: 87, name: 'Ala', turkishName: 'Ala', arabicName: 'الْأَعْلَى', englishName: 'The Most High', revelationPlace: 'Mekkî', verseCount: 19 },
  { number: 88, name: 'Gaşiye', turkishName: 'Gaşiye', arabicName: 'الْغَاشِيَة', englishName: 'The Overwhelming', revelationPlace: 'Mekkî', verseCount: 26 },
  { number: 89, name: 'Fecr', turkishName: 'Fecr', arabicName: 'الْفَجْر', englishName: 'The Dawn', revelationPlace: 'Mekkî', verseCount: 30 },
  { number: 90, name: 'Beled', turkishName: 'Beled', arabicName: 'الْبَلَد', englishName: 'The City', revelationPlace: 'Mekkî', verseCount: 20 },
  { number: 91, name: 'Şems', turkishName: 'Şems', arabicName: 'الشَّمْس', englishName: 'The Sun', revelationPlace: 'Mekkî', verseCount: 15 },
  { number: 92, name: 'Leyl', turkishName: 'Leyl', arabicName: 'اللَّيْل', englishName: 'The Night', revelationPlace: 'Mekkî', verseCount: 21 },
  { number: 93, name: 'Duha', turkishName: 'Duha', arabicName: 'الضُّحَى', englishName: 'The Morning Hours', revelationPlace: 'Mekkî', verseCount: 11 },
  { number: 94, name: 'İnşirah', turkishName: 'İnşirah', arabicName: 'الشَّرْح', englishName: 'The Relief', revelationPlace: 'Mekkî', verseCount: 8 },
  { number: 95, name: 'Tin', turkishName: 'Tin', arabicName: 'التِّين', englishName: 'The Fig', revelationPlace: 'Mekkî', verseCount: 8 },
  { number: 96, name: 'Alak', turkishName: 'Alak', arabicName: 'الْعَلَق', englishName: 'The Clot', revelationPlace: 'Mekkî', verseCount: 19 },
  { number: 97, name: 'Kadir', turkishName: 'Kadir', arabicName: 'الْقَدْر', englishName: 'The Power', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 98, name: 'Beyyine', turkishName: 'Beyyine', arabicName: 'الْبَيِّنَة', englishName: 'The Clear Proof', revelationPlace: 'Medenî', verseCount: 8 },
  { number: 99, name: 'Zilzal', turkishName: 'Zilzal', arabicName: 'الزَّلْزَلَة', englishName: 'The Earthquake', revelationPlace: 'Medenî', verseCount: 8 },
  { number: 100, name: 'Adiyat', turkishName: 'Adiyat', arabicName: 'الْعَادِيَات', englishName: 'The Courser', revelationPlace: 'Mekkî', verseCount: 11 },
  { number: 101, name: 'Karia', turkishName: 'Karia', arabicName: 'الْقَارِعَة', englishName: 'The Calamity', revelationPlace: 'Mekkî', verseCount: 11 },
  { number: 102, name: 'Tekasür', turkishName: 'Tekasür', arabicName: 'التَّكَاثُر', englishName: 'The Rivalry In World Increase', revelationPlace: 'Mekkî', verseCount: 8 },
  { number: 103, name: 'Asr', turkishName: 'Asr', arabicName: 'الْعَصْر', englishName: 'The Declining Day', revelationPlace: 'Mekkî', verseCount: 3 },
  { number: 104, name: 'Hümeze', turkishName: 'Hümeze', arabicName: 'الْهُمَزَة', englishName: 'The Traducer', revelationPlace: 'Mekkî', verseCount: 9 },
  { number: 105, name: 'Fil', turkishName: 'Fil', arabicName: 'الْفِيل', englishName: 'The Elephant', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 106, name: 'Kureyş', turkishName: 'Kureyş', arabicName: 'قُرَيْش', englishName: 'Quraysh', revelationPlace: 'Mekkî', verseCount: 4 },
  { number: 107, name: 'Maun', turkishName: 'Maun', arabicName: 'الْمَاعُون', englishName: 'The Small Kindnesses', revelationPlace: 'Mekkî', verseCount: 7 },
  { number: 108, name: 'Kevser', turkishName: 'Kevser', arabicName: 'الْكَوْثَر', englishName: 'The Abundance', revelationPlace: 'Mekkî', verseCount: 3 },
  { number: 109, name: 'Kafirun', turkishName: 'Kafirun', arabicName: 'الْكَافِرُون', englishName: 'The Disbelievers', revelationPlace: 'Mekkî', verseCount: 6 },
  { number: 110, name: 'Nasr', turkishName: 'Nasr', arabicName: 'النَّصْر', englishName: 'The Divine Support', revelationPlace: 'Medenî', verseCount: 3 },
  { number: 111, name: 'Mesed', turkishName: 'Mesed', arabicName: 'الْمَسَد', englishName: 'The Palm Fibre', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 112, name: 'İhlas', turkishName: 'İhlas', arabicName: 'الْإِخْلَاص', englishName: 'The Sincerity', revelationPlace: 'Mekkî', verseCount: 4 },
  { number: 113, name: 'Felak', turkishName: 'Felak', arabicName: 'الْفَلَق', englishName: 'The Daybreak', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 114, name: 'Nas', turkishName: 'Nas', arabicName: 'النَّاس', englishName: 'Mankind', revelationPlace: 'Mekkî', verseCount: 6 }];

// Cache for loaded surahs
const loadedSurahs = new Map<number, Surah>();

// Load verses for a specific surah
async function loadSurahVerses(surahNumber: number): Promise<Verse[]> {
  const surahMeta = SURAH_METADATA.find(s => s.number === surahNumber);
  if (!surahMeta) return [];

  const verses: Verse[] = [];

  for (let verseNumber = 1; verseNumber <= surahMeta.verseCount; verseNumber++) {
    const verseData = await requireVerse(surahNumber, verseNumber);
    if (verseData) {
      verses.push(convertToAppFormat(verseData));
    }
  }

  return verses;
}

// Load a single surah
export async function loadSurah(surahNumber: number): Promise<Surah | null> {
  if (loadedSurahs.has(surahNumber)) {
    return loadedSurahs.get(surahNumber)!;
  }

  const surahMeta = SURAH_METADATA.find(s => s.number === surahNumber);
  if (!surahMeta) return null;

  const verses = await loadSurahVerses(surahNumber);

  const surah: Surah = {
    number: surahMeta.number,
    name: surahMeta.name,
    arabicName: surahMeta.arabicName,
    englishName: surahMeta.englishName,
    revelationPlace: surahMeta.revelationPlace,
    verseCount: surahMeta.verseCount,
    verses: verses
  };

  loadedSurahs.set(surahNumber, surah);
  return surah;
}

// Get basic surah info (for listing) - doesn't load verses
export function getSurahsList() {
  return SURAH_METADATA.map(meta => ({
    ...meta,
    verses: [] as Verse[]
  })) as Surah[];
}

// Get a random verse from the Quran
export async function getRandomVerse(): Promise<{ surah: Surah, verse: Verse, verseIndex: number } | null> {
  try {
    // Pick a random surah
    const randomSurahNumber = Math.floor(Math.random() * 114) + 1;
    const surah = await loadSurah(randomSurahNumber);

    if (!surah || surah.verses.length === 0) {
      return null;
    }

    // Pick a random verse from the surah
    const randomVerseIndex = Math.floor(Math.random() * surah.verses.length);
    const verse = surah.verses[randomVerseIndex];

    return {
      surah,
      verse,
      verseIndex: randomVerseIndex
    };
  } catch (error) {
    logger.error('Error getting random verse:', error);
    return null;
  }
}

// Main QuranData object - starts with metadata only, loads verses on demand
export const quranData: QuranData = {
  surahs: getSurahsList(),
  totalSurahs: 114,
  totalVerses: 6236
};

export default quranData;
