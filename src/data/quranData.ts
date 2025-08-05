import { QuranData, Surah, Verse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
    console.log(`📦 Chunking data into ${chunks} smaller chunks of 1MB each`);

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
  console.log('📚 loadAllVerses called - allVersesCache exists:', !!allVersesCache, 'cache length:', allVersesCache?.length || 0);

  if (allVersesCache && allVersesCache.length > 0) {
    console.log('✅ Data already loaded, returning early');
    progressCallback?.(100, 'Veri zaten yüklü');
    return;
  }

  try {
    progressCallback?.(10, 'Cache kontrol ediliyor...');

    // Check localStorage first
    console.log('🔍 Checking localStorage cache...');
    const cachedData = await Storage.getItem(VERSES_CACHE_KEY);
    const cachedVersion = await Storage.getItem(VERSES_VERSION_KEY);

    console.log('📦 Cache status:', {
      hasCachedData: !!cachedData,
      cachedDataLength: cachedData ? cachedData.length : 0,
      cachedVersion,
      currentVersion: CURRENT_VERSION,
      versionMatch: cachedVersion === CURRENT_VERSION
    });

    if (cachedData && cachedVersion === CURRENT_VERSION) {
      progressCallback?.(50, 'Cache\'ten yükleniyor...');
      console.log('🚀 Loading from cache...');
      allVersesCache = JSON.parse(cachedData);
      console.log('✅ Cache loaded successfully, verses count:', allVersesCache!.length);
      progressCallback?.(100, 'Tamamlandı!');
      return;
    }

    // Clear old cache if version mismatch
    if (cachedData && cachedVersion !== CURRENT_VERSION) {
      progressCallback?.(20, 'Eski cache temizleniyor...');
      console.log('🧹 Clearing old cache due to version mismatch');
      await Storage.removeItem(VERSES_CACHE_KEY);
      await Storage.removeItem(VERSES_VERSION_KEY);
    }

    // Load from server if no cache or version mismatch
    progressCallback?.(30, 'Sunucudan indiriliyor...');
    console.log('📡 Loading from server...');
    const response = await fetch('/allVerses.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    progressCallback?.(60, 'Veri işleniyor...');
    const data = await response.json();
    console.log('📥 Data loaded from server, size:', JSON.stringify(data).length);

    // Convert object to array if needed
    const versesArray = Array.isArray(data) ? data : Object.values(data);

    allVersesCache = versesArray;

    progressCallback?.(80, 'Cache\'e kaydediliyor...');
    console.log('💾 Saving to cache...');
    try {
      // Cache the data
      await Storage.setItem(VERSES_CACHE_KEY, JSON.stringify(versesArray));
      await Storage.setItem(VERSES_VERSION_KEY, CURRENT_VERSION);
      console.log('✅ Data cached successfully, verses count:', versesArray.length);
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

// Complete Surah metadata (all 114 surahs)
const SURAH_METADATA = [
  { number: 1, name: 'Al-Fatiha', arabicName: 'الْفَاتِحَة', englishName: 'The Opening', revelationPlace: 'Mecca', verseCount: 7 },
  { number: 2, name: 'Al-Baqarah', arabicName: 'الْبَقَرَة', englishName: 'The Cow', revelationPlace: 'Medina', verseCount: 286 },
  { number: 3, name: 'Āl-ʿImrān', arabicName: 'آل عِمْرَان', englishName: 'The Family of Imran', revelationPlace: 'Medina', verseCount: 200 },
  { number: 4, name: 'An-Nisāʾ', arabicName: 'النِّسَاء', englishName: 'The Women', revelationPlace: 'Medina', verseCount: 176 },
  { number: 5, name: 'Al-Māʾidah', arabicName: 'الْمَائِدَة', englishName: 'The Table Spread', revelationPlace: 'Medina', verseCount: 120 },
  { number: 6, name: 'Al-Anʿām', arabicName: 'الْأَنْعَام', englishName: 'The Cattle', revelationPlace: 'Mecca', verseCount: 165 },
  { number: 7, name: 'Al-Aʿrāf', arabicName: 'الْأَعْرَاف', englishName: 'The Heights', revelationPlace: 'Mecca', verseCount: 206 },
  { number: 8, name: 'Al-Anfāl', arabicName: 'الْأَنْفَال', englishName: 'The Spoils of War', revelationPlace: 'Medina', verseCount: 75 },
  { number: 9, name: 'At-Tawbah', arabicName: 'التَّوْبَة', englishName: 'The Repentance', revelationPlace: 'Medina', verseCount: 129 },
  { number: 10, name: 'Yūnus', arabicName: 'يُونُس', englishName: 'Jonah', revelationPlace: 'Mecca', verseCount: 109 },
  { number: 11, name: 'Hūd', arabicName: 'هُود', englishName: 'Hud', revelationPlace: 'Mecca', verseCount: 123 },
  { number: 12, name: 'Yūsuf', arabicName: 'يُوسُف', englishName: 'Joseph', revelationPlace: 'Mecca', verseCount: 111 },
  { number: 13, name: 'Ar-Raʿd', arabicName: 'الرَّعْد', englishName: 'The Thunder', revelationPlace: 'Medina', verseCount: 43 },
  { number: 14, name: 'Ibrāhīm', arabicName: 'إِبْرَاهِيم', englishName: 'Abraham', revelationPlace: 'Mecca', verseCount: 52 },
  { number: 15, name: 'Al-Ḥijr', arabicName: 'الْحِجْر', englishName: 'The Rocky Tract', revelationPlace: 'Mecca', verseCount: 99 },
  { number: 16, name: 'An-Naḥl', arabicName: 'النَّحْل', englishName: 'The Bee', revelationPlace: 'Mecca', verseCount: 128 },
  { number: 17, name: 'Al-Isrāʾ', arabicName: 'الْإِسْرَاء', englishName: 'The Night Journey', revelationPlace: 'Mecca', verseCount: 111 },
  { number: 18, name: 'Al-Kahf', arabicName: 'الْكَهْف', englishName: 'The Cave', revelationPlace: 'Mecca', verseCount: 110 },
  { number: 19, name: 'Maryam', arabicName: 'مَرْيَم', englishName: 'Mary', revelationPlace: 'Mecca', verseCount: 98 },
  { number: 20, name: 'Ṭā-Hā', arabicName: 'طه', englishName: 'Ta-Ha', revelationPlace: 'Mecca', verseCount: 135 },
  { number: 21, name: 'Al-Anbiyāʾ', arabicName: 'الْأَنْبِيَاء', englishName: 'The Prophets', revelationPlace: 'Mecca', verseCount: 112 },
  { number: 22, name: 'Al-Ḥajj', arabicName: 'الْحَجّ', englishName: 'The Pilgrimage', revelationPlace: 'Medina', verseCount: 78 },
  { number: 23, name: 'Al-Muʾminūn', arabicName: 'الْمُؤْمِنُون', englishName: 'The Believers', revelationPlace: 'Mecca', verseCount: 118 },
  { number: 24, name: 'An-Nūr', arabicName: 'النُّور', englishName: 'The Light', revelationPlace: 'Medina', verseCount: 64 },
  { number: 25, name: 'Al-Furqān', arabicName: 'الْفُرْقَان', englishName: 'The Criterion', revelationPlace: 'Mecca', verseCount: 77 },
  { number: 26, name: 'Ash-Shuʿarāʾ', arabicName: 'الشُّعَرَاء', englishName: 'The Poets', revelationPlace: 'Mecca', verseCount: 227 },
  { number: 27, name: 'An-Naml', arabicName: 'النَّمْل', englishName: 'The Ant', revelationPlace: 'Mecca', verseCount: 93 },
  { number: 28, name: 'Al-Qaṣaṣ', arabicName: 'الْقَصَص', englishName: 'The Stories', revelationPlace: 'Mecca', verseCount: 88 },
  { number: 29, name: 'Al-ʿAnkabūt', arabicName: 'الْعَنْكَبُوت', englishName: 'The Spider', revelationPlace: 'Mecca', verseCount: 69 },
  { number: 30, name: 'Ar-Rūm', arabicName: 'الرُّوم', englishName: 'The Romans', revelationPlace: 'Mecca', verseCount: 60 },
  { number: 31, name: 'Luqmān', arabicName: 'لُقْمَان', englishName: 'Luqman', revelationPlace: 'Mecca', verseCount: 34 },
  { number: 32, name: 'As-Sajdah', arabicName: 'السَّجْدَة', englishName: 'The Prostration', revelationPlace: 'Mecca', verseCount: 30 },
  { number: 33, name: 'Al-Aḥzāb', arabicName: 'الْأَحْزَاب', englishName: 'The Clans', revelationPlace: 'Medina', verseCount: 73 },
  { number: 34, name: 'Sabāʾ', arabicName: 'سَبَأ', englishName: 'Sheba', revelationPlace: 'Mecca', verseCount: 54 },
  { number: 35, name: 'Fāṭir', arabicName: 'فَاطِر', englishName: 'Originator', revelationPlace: 'Mecca', verseCount: 45 },
  { number: 36, name: 'Yā-Sīn', arabicName: 'يس', englishName: 'Ya Sin', revelationPlace: 'Mecca', verseCount: 83 },
  { number: 37, name: 'Aṣ-Ṣāffāt', arabicName: 'الصَّافَّات', englishName: 'Those Who Set The Ranks', revelationPlace: 'Mecca', verseCount: 182 },
  { number: 38, name: 'Ṣād', arabicName: 'ص', englishName: 'The Letter Sad', revelationPlace: 'Mecca', verseCount: 88 },
  { number: 39, name: 'Az-Zumar', arabicName: 'الزُّمَر', englishName: 'The Troops', revelationPlace: 'Mecca', verseCount: 75 },
  { number: 40, name: 'Ghāfir', arabicName: 'غَافِر', englishName: 'The Forgiver', revelationPlace: 'Mecca', verseCount: 85 },
  { number: 41, name: 'Fuṣṣilat', arabicName: 'فُصِّلَت', englishName: 'Explained In Detail', revelationPlace: 'Mecca', verseCount: 54 },
  { number: 42, name: 'Ash-Shūrā', arabicName: 'الشُّورَى', englishName: 'The Consultation', revelationPlace: 'Mecca', verseCount: 53 },
  { number: 43, name: 'Az-Zukhruf', arabicName: 'الزُّخْرُف', englishName: 'The Ornaments Of Gold', revelationPlace: 'Mecca', verseCount: 89 },
  { number: 44, name: 'Ad-Dukhān', arabicName: 'الدُّخَان', englishName: 'The Smoke', revelationPlace: 'Mecca', verseCount: 59 },
  { number: 45, name: 'Al-Jāthiyah', arabicName: 'الْجَاثِيَة', englishName: 'The Crouching', revelationPlace: 'Mecca', verseCount: 37 },
  { number: 46, name: 'Al-Aḥqāf', arabicName: 'الْأَحْقَاف', englishName: 'The Wind-Curved Sandhills', revelationPlace: 'Mecca', verseCount: 35 },
  { number: 47, name: 'Muḥammad', arabicName: 'مُحَمَّد', englishName: 'Muhammad', revelationPlace: 'Medina', verseCount: 38 },
  { number: 48, name: 'Al-Fatḥ', arabicName: 'الْفَتْح', englishName: 'The Victory', revelationPlace: 'Medina', verseCount: 29 },
  { number: 49, name: 'Al-Ḥujurāt', arabicName: 'الْحُجُرَات', englishName: 'The Rooms', revelationPlace: 'Medina', verseCount: 18 },
  { number: 50, name: 'Qāf', arabicName: 'ق', englishName: 'The Letter Qaf', revelationPlace: 'Mecca', verseCount: 45 },
  { number: 51, name: 'Adh-Dhāriyāt', arabicName: 'الذَّارِيَات', englishName: 'The Winnowing Winds', revelationPlace: 'Mecca', verseCount: 60 },
  { number: 52, name: 'Aṭ-Ṭūr', arabicName: 'الطُّور', englishName: 'The Mount', revelationPlace: 'Mecca', verseCount: 49 },
  { number: 53, name: 'An-Najm', arabicName: 'النَّجْم', englishName: 'The Star', revelationPlace: 'Mecca', verseCount: 62 },
  { number: 54, name: 'Al-Qamar', arabicName: 'الْقَمَر', englishName: 'The Moon', revelationPlace: 'Mecca', verseCount: 55 },
  { number: 55, name: 'Ar-Raḥmān', arabicName: 'الرَّحْمَن', englishName: 'The Beneficent', revelationPlace: 'Medina', verseCount: 78 },
  { number: 56, name: 'Al-Wāqiʿah', arabicName: 'الْوَاقِعَة', englishName: 'The Inevitable', revelationPlace: 'Mecca', verseCount: 96 },
  { number: 57, name: 'Al-Ḥadīd', arabicName: 'الْحَدِيد', englishName: 'The Iron', revelationPlace: 'Medina', verseCount: 29 },
  { number: 58, name: 'Al-Mujādila', arabicName: 'الْمُجَادَلَة', englishName: 'The Pleading Woman', revelationPlace: 'Medina', verseCount: 22 },
  { number: 59, name: 'Al-Ḥashr', arabicName: 'الْحَشْر', englishName: 'The Exile', revelationPlace: 'Medina', verseCount: 24 },
  { number: 60, name: 'Al-Mumtaḥanah', arabicName: 'الْمُمْتَحَنَة', englishName: 'She That Is To Be Examined', revelationPlace: 'Medina', verseCount: 13 },
  { number: 61, name: 'Aṣ-Ṣaff', arabicName: 'الصَّف', englishName: 'The Ranks', revelationPlace: 'Medina', verseCount: 14 },
  { number: 62, name: 'Al-Jumuʿah', arabicName: 'الْجُمُعَة', englishName: 'The Congregation', revelationPlace: 'Medina', verseCount: 11 },
  { number: 63, name: 'Al-Munāfiqūn', arabicName: 'الْمُنَافِقُون', englishName: 'The Hypocrites', revelationPlace: 'Medina', verseCount: 11 },
  { number: 64, name: 'At-Taghābun', arabicName: 'التَّغَابُن', englishName: 'The Mutual Disillusion', revelationPlace: 'Medina', verseCount: 18 },
  { number: 65, name: 'Aṭ-Ṭalāq', arabicName: 'الطَّلَاق', englishName: 'The Divorce', revelationPlace: 'Medina', verseCount: 12 },
  { number: 66, name: 'At-Taḥrīm', arabicName: 'التَّحْرِيم', englishName: 'The Prohibition', revelationPlace: 'Medina', verseCount: 12 },
  { number: 67, name: 'Al-Mulk', arabicName: 'الْمُلْك', englishName: 'The Sovereignty', revelationPlace: 'Mecca', verseCount: 30 },
  { number: 68, name: 'Al-Qalam', arabicName: 'الْقَلَم', englishName: 'The Pen', revelationPlace: 'Mecca', verseCount: 52 },
  { number: 69, name: 'Al-Ḥāqqah', arabicName: 'الْحَاقَّة', englishName: 'The Reality', revelationPlace: 'Mecca', verseCount: 52 },
  { number: 70, name: 'Al-Maʿārij', arabicName: 'الْمَعَارِج', englishName: 'The Ascending Stairways', revelationPlace: 'Mecca', verseCount: 44 },
  { number: 71, name: 'Nūḥ', arabicName: 'نُوح', englishName: 'Noah', revelationPlace: 'Mecca', verseCount: 28 },
  { number: 72, name: 'Al-Jinn', arabicName: 'الْجِنّ', englishName: 'The Jinn', revelationPlace: 'Mecca', verseCount: 28 },
  { number: 73, name: 'Al-Muzzammil', arabicName: 'الْمُزَّمِّل', englishName: 'The Enshrouded One', revelationPlace: 'Mecca', verseCount: 20 },
  { number: 74, name: 'Al-Muddaththir', arabicName: 'الْمُدَّثِّر', englishName: 'The Cloaked One', revelationPlace: 'Mecca', verseCount: 56 },
  { number: 75, name: 'Al-Qiyāmah', arabicName: 'الْقِيَامَة', englishName: 'The Resurrection', revelationPlace: 'Mecca', verseCount: 40 },
  { number: 76, name: 'Al-Insān', arabicName: 'الْإِنْسَان', englishName: 'The Human', revelationPlace: 'Medina', verseCount: 31 },
  { number: 77, name: 'Al-Mursalāt', arabicName: 'الْمُرْسَلَات', englishName: 'The Emissaries', revelationPlace: 'Mecca', verseCount: 50 },
  { number: 78, name: 'An-Nabaʾ', arabicName: 'النَّبَأ', englishName: 'The Tidings', revelationPlace: 'Mecca', verseCount: 40 },
  { number: 79, name: 'An-Nāziʿāt', arabicName: 'النَّازِعَات', englishName: 'Those Who Drag Forth', revelationPlace: 'Mecca', verseCount: 46 },
  { number: 80, name: 'ʿAbasa', arabicName: 'عَبَسَ', englishName: 'He Frowned', revelationPlace: 'Mecca', verseCount: 42 },
  { number: 81, name: 'At-Takwīr', arabicName: 'التَّكْوِير', englishName: 'The Overthrowing', revelationPlace: 'Mecca', verseCount: 29 },
  { number: 82, name: 'Al-Infiṭār', arabicName: 'الْإِنْفِطَار', englishName: 'The Cleaving', revelationPlace: 'Mecca', verseCount: 19 },
  { number: 83, name: 'Al-Muṭaffifīn', arabicName: 'الْمُطَفِّفِين', englishName: 'The Defrauding', revelationPlace: 'Mecca', verseCount: 36 },
  { number: 84, name: 'Al-Inshiqāq', arabicName: 'الْإِنْشِقَاق', englishName: 'The Sundering', revelationPlace: 'Mecca', verseCount: 25 },
  { number: 85, name: 'Al-Burūj', arabicName: 'الْبُرُوج', englishName: 'The Mansions Of The Stars', revelationPlace: 'Mecca', verseCount: 22 },
  { number: 86, name: 'Aṭ-Ṭāriq', arabicName: 'الطَّارِق', englishName: 'The Morning Star', revelationPlace: 'Mecca', verseCount: 17 },
  { number: 87, name: 'Al-Aʿlā', arabicName: 'الْأَعْلَى', englishName: 'The Most High', revelationPlace: 'Mecca', verseCount: 19 },
  { number: 88, name: 'Al-Ghāshiyah', arabicName: 'الْغَاشِيَة', englishName: 'The Overwhelming', revelationPlace: 'Mecca', verseCount: 26 },
  { number: 89, name: 'Al-Fajr', arabicName: 'الْفَجْر', englishName: 'The Dawn', revelationPlace: 'Mecca', verseCount: 30 },
  { number: 90, name: 'Al-Balad', arabicName: 'الْبَلَد', englishName: 'The City', revelationPlace: 'Mecca', verseCount: 20 },
  { number: 91, name: 'Ash-Shams', arabicName: 'الشَّمْس', englishName: 'The Sun', revelationPlace: 'Mecca', verseCount: 15 },
  { number: 92, name: 'Al-Layl', arabicName: 'اللَّيْل', englishName: 'The Night', revelationPlace: 'Mecca', verseCount: 21 },
  { number: 93, name: 'Aḍ-Ḍuḥā', arabicName: 'الضُّحَى', englishName: 'The Morning Hours', revelationPlace: 'Mecca', verseCount: 11 },
  { number: 94, name: 'Ash-Sharḥ', arabicName: 'الشَّرْح', englishName: 'The Relief', revelationPlace: 'Mecca', verseCount: 8 },
  { number: 95, name: 'At-Tīn', arabicName: 'التِّين', englishName: 'The Fig', revelationPlace: 'Mecca', verseCount: 8 },
  { number: 96, name: 'Al-ʿAlaq', arabicName: 'الْعَلَق', englishName: 'The Clot', revelationPlace: 'Mecca', verseCount: 19 },
  { number: 97, name: 'Al-Qadr', arabicName: 'الْقَدْر', englishName: 'The Power', revelationPlace: 'Mecca', verseCount: 5 },
  { number: 98, name: 'Al-Bayyinah', arabicName: 'الْبَيِّنَة', englishName: 'The Clear Proof', revelationPlace: 'Medina', verseCount: 8 },
  { number: 99, name: 'Az-Zalzalah', arabicName: 'الزَّلْزَلَة', englishName: 'The Earthquake', revelationPlace: 'Medina', verseCount: 8 },
  { number: 100, name: 'Al-ʿĀdiyāt', arabicName: 'الْعَادِيَات', englishName: 'The Courser', revelationPlace: 'Mecca', verseCount: 11 },
  { number: 101, name: 'Al-Qāriʿah', arabicName: 'الْقَارِعَة', englishName: 'The Calamity', revelationPlace: 'Mecca', verseCount: 11 },
  { number: 102, name: 'At-Takāthur', arabicName: 'التَّكَاثُر', englishName: 'The Rivalry In World Increase', revelationPlace: 'Mecca', verseCount: 8 },
  { number: 103, name: 'Al-ʿAṣr', arabicName: 'الْعَصْر', englishName: 'The Declining Day', revelationPlace: 'Mecca', verseCount: 3 },
  { number: 104, name: 'Al-Humazah', arabicName: 'الْهُمَزَة', englishName: 'The Traducer', revelationPlace: 'Mecca', verseCount: 9 },
  { number: 105, name: 'Al-Fīl', arabicName: 'الْفِيل', englishName: 'The Elephant', revelationPlace: 'Mecca', verseCount: 5 },
  { number: 106, name: 'Quraysh', arabicName: 'قُرَيْش', englishName: 'Quraysh', revelationPlace: 'Mecca', verseCount: 4 },
  { number: 107, name: 'Al-Māʿūn', arabicName: 'الْمَاعُون', englishName: 'The Small Kindnesses', revelationPlace: 'Mecca', verseCount: 7 },
  { number: 108, name: 'Al-Kawthar', arabicName: 'الْكَوْثَر', englishName: 'The Abundance', revelationPlace: 'Mecca', verseCount: 3 },
  { number: 109, name: 'Al-Kāfirūn', arabicName: 'الْكَافِرُون', englishName: 'The Disbelievers', revelationPlace: 'Mecca', verseCount: 6 },
  { number: 110, name: 'An-Naṣr', arabicName: 'النَّصْر', englishName: 'The Divine Support', revelationPlace: 'Medina', verseCount: 3 },
  { number: 111, name: 'Al-Masad', arabicName: 'الْمَسَد', englishName: 'The Palm Fibre', revelationPlace: 'Mecca', verseCount: 5 },
  { number: 112, name: 'Al-Ikhlāṣ', arabicName: 'الْإِخْلَاص', englishName: 'The Sincerity', revelationPlace: 'Mecca', verseCount: 4 },
  { number: 113, name: 'Al-Falaq', arabicName: 'الْفَلَق', englishName: 'The Daybreak', revelationPlace: 'Mecca', verseCount: 5 },
  { number: 114, name: 'An-Nās', arabicName: 'النَّاس', englishName: 'Mankind', revelationPlace: 'Mecca', verseCount: 6 }
];

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

// Main QuranData object - starts with metadata only, loads verses on demand
export const quranData: QuranData = {
  surahs: getSurahsList(),
  totalSurahs: 114,
  totalVerses: 6236
};

export default quranData;
