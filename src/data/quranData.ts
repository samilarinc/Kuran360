import { QuranData, Surah, Verse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '@/utils/logger';
import { sqliteHelper } from '@/services/sqliteService';

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

// IndexedDB Database configuration
const DB_NAME = 'Kuran360DB';
const DB_VERSION = 2; // Increment version for new structure
const VERSES_STORE = 'verses';
const META_STORE = 'meta';

// Legacy keys for migration
const LEGACY_CACHE_KEY = 'quran_verses_data';
const LEGACY_VERSION_KEY = 'quran_verses_version';

const CURRENT_VERSION = '3.1'; // New version for per-verse storage and Kurdish translations
const META_VERSION_KEY = 'data_version';

// IndexedDB Helper Class
class IndexedDBHelper {
  private db: any = null;
  private dbPromise: Promise<any> | null = null;

  async openDB(): Promise<any> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const globalObj = globalThis as any;
      if (!globalObj.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = globalObj.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create verses store with composite key
        if (!db.objectStoreNames.contains(VERSES_STORE)) {
          const versesStore = db.createObjectStore(VERSES_STORE, { keyPath: 'key' });
          versesStore.createIndex('surahNumber', 'surahNumber', { unique: false });
        }

        // Create meta store for version info
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }

        // Keep legacy cache store for migration
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  // Reset database connection (used after deleting database)
  resetConnection(): void {
    this.db = null;
    this.dbPromise = null;
  }

  // Get a single verse by surah and verse number
  async getVerse(surahNumber: number, verseNumber: number): Promise<VerseData | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([VERSES_STORE], 'readonly');
      const store = transaction.objectStore(VERSES_STORE);
      const key = `${surahNumber}_${verseNumber}`;

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
      });
    } catch (error) {
      console.error('Error getting verse from IndexedDB:', error);
      return null;
    }
  }

  // Get all verses for a surah
  async getSurahVerses(surahNumber: number): Promise<VerseData[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([VERSES_STORE], 'readonly');
      const store = transaction.objectStore(VERSES_STORE);
      const index = store.index('surahNumber');
      const globalObj = globalThis as any;

      return new Promise((resolve, reject) => {
        const verses: VerseData[] = [];
        const request = index.openCursor(globalObj.IDBKeyRange.only(surahNumber));

        request.onerror = () => reject(request.error);
        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            verses.push(cursor.value.data);
            cursor.continue();
          } else {
            // Sort by verse number before returning
            verses.sort((a, b) => a.verse_number - b.verse_number);
            resolve(verses);
          }
        };
      });
    } catch (error) {
      console.error('Error getting surah verses from IndexedDB:', error);
      return [];
    }
  }

  // Store a single verse
  async setVerse(surahNumber: number, verseNumber: number, data: VerseData): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([VERSES_STORE], 'readwrite');
      const store = transaction.objectStore(VERSES_STORE);
      const key = `${surahNumber}_${verseNumber}`;

      return new Promise((resolve, reject) => {
        const request = store.put({ key, surahNumber, verseNumber, data });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Error storing verse in IndexedDB:', error);
      throw error;
    }
  }

  // Store multiple verses in batch (for initial load/migration)
  async setVersesBatch(verses: VerseData[], progressCallback?: (progress: number) => void): Promise<void> {
    try {
      const db = await this.openDB();
      const totalVerses = verses.length;
      let processed = 0;
      const batchSize = 100; // Process in batches to avoid blocking

      for (let i = 0; i < verses.length; i += batchSize) {
        const batch = verses.slice(i, i + batchSize);

        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([VERSES_STORE], 'readwrite');
          const store = transaction.objectStore(VERSES_STORE);

          transaction.oncomplete = () => {
            processed += batch.length;
            if (progressCallback) {
              progressCallback((processed / totalVerses) * 100);
            }
            resolve();
          };

          transaction.onerror = () => reject(transaction.error);

          for (const verse of batch) {
            const key = `${verse.surah_number}_${verse.verse_number}`;
            store.put({
              key,
              surahNumber: verse.surah_number,
              verseNumber: verse.verse_number,
              data: verse
            });
          }
        });
      }
    } catch (error) {
      console.error('Error batch storing verses in IndexedDB:', error);
      throw error;
    }
  }

  // Get meta value
  async getMeta(key: string): Promise<string | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([META_STORE], 'readonly');
      const store = transaction.objectStore(META_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
      });
    } catch (error) {
      console.error('Error getting meta from IndexedDB:', error);
      return null;
    }
  }

  // Set meta value
  async setMeta(key: string, value: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([META_STORE], 'readwrite');
      const store = transaction.objectStore(META_STORE);

      return new Promise((resolve, reject) => {
        const request = store.put({ key, value });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Error setting meta in IndexedDB:', error);
      throw error;
    }
  }

  // Check if verses exist in new format
  async hasVersesInNewFormat(): Promise<boolean> {
    try {
      const version = await this.getMeta(META_VERSION_KEY);
      if (version !== CURRENT_VERSION) return false;

      // Quick check - try to get first verse
      const firstVerse = await this.getVerse(1, 1);
      return !!firstVerse;
    } catch (error) {
      return false;
    }
  }

  // Get legacy data for migration
  async getLegacyData(): Promise<VerseData[] | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');

      return new Promise((resolve, reject) => {
        const request = store.get(LEGACY_CACHE_KEY);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.value) {
            try {
              const data = JSON.parse(result.value);
              resolve(Array.isArray(data) ? data : Object.values(data));
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('Error getting legacy data:', error);
      return null;
    }
  }

  // Clear legacy data after migration
  async clearLegacyData(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(LEGACY_CACHE_KEY);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(LEGACY_VERSION_KEY);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('Error clearing legacy data:', error);
    }
  }

  // Get total verse count
  async getVerseCount(): Promise<number> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([VERSES_STORE], 'readonly');
      const store = transaction.objectStore(VERSES_STORE);

      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error('Error getting verse count:', error);
      return 0;
    }
  }
}

// Create singleton instance
const idbHelper = new IndexedDBHelper();

// Progress callback type
export type ProgressCallback = (progress: number, status: string, downloadedBytes?: number, totalBytes?: number) => void;

// Check if data is cached in the new format
export const isDataCached = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return await idbHelper.hasVersesInNewFormat();
    } else {
      // For mobile, check SQLite database
      const version = await sqliteHelper.getMeta(META_VERSION_KEY);
      const hasData = await sqliteHelper.hasData();
      return version === CURRENT_VERSION && hasData;
    }
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
};

// Check if any version of data exists
export const hasAnyData = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      const firstVerse = await idbHelper.getVerse(1, 1);
      return !!firstVerse;
    } else {
      return await sqliteHelper.hasData();
    }
  } catch (error) {
    return false;
  }
};

// Load all verses - now migrates to per-verse storage
export const loadAllVerses = async (progressCallback?: ProgressCallback): Promise<void> => {
  try {
    progressCallback?.(5, 'Veri formatı kontrol ediliyor...');

    if (Platform.OS === 'web') {
      // Check if already migrated to new format
      const hasNewFormat = await idbHelper.hasVersesInNewFormat();

      // If we have new format and it's not a forced update, return early
      const currentStoredVersion = await idbHelper.getMeta(META_VERSION_KEY);
      if (hasNewFormat && currentStoredVersion === CURRENT_VERSION) {
        logger.debug('✅ Data already in new per-verse format');
        progressCallback?.(100, 'Veri zaten yüklü');
        return;
      }

      // Check for legacy data to migrate
      progressCallback?.(10, 'Eski veri kontrol ediliyor...');
      const legacyData = await idbHelper.getLegacyData();

      if (legacyData && legacyData.length > 0) {
        logger.debug('🔄 Migrating legacy data to new format...');
        progressCallback?.(15, 'Veri yeni formata taşınıyor...');

        await idbHelper.setVersesBatch(legacyData, (progress) => {
          progressCallback?.(15 + progress * 0.7, `Ayetler kaydediliyor... %${Math.round(progress)}`);
        });

        await idbHelper.setMeta(META_VERSION_KEY, CURRENT_VERSION);
        await idbHelper.clearLegacyData();

        logger.debug('✅ Migration complete');
        progressCallback?.(100, 'Veri taşıma tamamlandı!');
        return;
      }

      // No data - need to download
      // First, clear any existing databases
      progressCallback?.(0, 'Eski veriler temizleniyor...');
      logger.debug('🧹 Clearing any existing databases...');

      try {
        const globalObj = globalThis as any;
        if (globalObj.indexedDB) {
          // Delete old databases
          await new Promise<void>((resolve) => {
            const req1 = globalObj.indexedDB.deleteDatabase('QuranAppDB');
            req1.onsuccess = () => resolve();
            req1.onerror = () => resolve();
            req1.onblocked = () => resolve();
          });

          await new Promise<void>((resolve) => {
            const req2 = globalObj.indexedDB.deleteDatabase('QuranApp');
            req2.onsuccess = () => resolve();
            req2.onerror = () => resolve();
            req2.onblocked = () => resolve();
          });

          await new Promise<void>((resolve) => {
            const req3 = globalObj.indexedDB.deleteDatabase(DB_NAME);
            req3.onsuccess = () => resolve();
            req3.onerror = () => resolve();
            req3.onblocked = () => resolve();
          });

          // Reset db connection
          idbHelper.resetConnection();

          logger.debug('✅ Old databases deleted');
        }
      } catch (clearError) {
        logger.warn('⚠️ Error clearing old databases:', clearError);
      }

      progressCallback?.(5, 'Sunucudan indiriliyor...');
      logger.debug('📡 Loading from server...');

      // Add a timestamp to bypass cache
      const fetchUrl = `/allVerses.json?t=${Date.now()}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get total size from content-length header
      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      let downloadedBytes = 0;
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          downloadedBytes += value.length;

          if (totalBytes > 0) {
            const downloadProgress = (downloadedBytes / totalBytes) * 80; // 0-80% for download
            progressCallback?.(downloadProgress, 'İndiriliyor...', downloadedBytes, totalBytes);
          } else {
            // Fallback progress if size unknown
            progressCallback?.(40, 'İndiriliyor...', downloadedBytes);
          }
        }
      }

      // Combine chunks and parse
      progressCallback?.(85, 'Veri işleniyor...');

      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Decode to string and parse JSON
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(combined);
      const data = JSON.parse(text);
      const versesArray: VerseData[] = Array.isArray(data) ? data : Object.values(data);

      logger.debug(`📥 Downloaded ${versesArray.length} verses`);

      progressCallback?.(90, 'Veritabanına kaydediliyor...');

      await idbHelper.setVersesBatch(versesArray, (progress) => {
        progressCallback?.(90 + progress * 0.09, 'Kaydediliyor...', downloadedBytes, totalBytes);
      });

      await idbHelper.setMeta(META_VERSION_KEY, CURRENT_VERSION);

      logger.debug('✅ Data saved in new per-verse format');
      progressCallback?.(100, 'Başarıyla tamamlandı!');

    } else {
      // Mobile platform - use SQLite
      logger.debug('📱 Checking SQLite database...');

      const version = await sqliteHelper.getMeta(META_VERSION_KEY);
      const hasData = await sqliteHelper.hasData();

      if (version === CURRENT_VERSION && hasData) {
        progressCallback?.(100, 'Veri zaten yüklü');
        logger.debug('✅ Data already in SQLite database');
        return;
      }

      logger.debug('📡 Downloading data from server...');
      progressCallback?.(10, 'Sunucudan indiriliyor...');

      // Download data from server
      const response = await fetch('https://kuran360.com/allVerses.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      progressCallback?.(50, 'Veri işleniyor...');
      const data = await response.json();
      const versesArray: VerseData[] = Array.isArray(data) ? data : Object.values(data);

      logger.debug(`📥 Downloaded ${versesArray.length} verses, storing in SQLite...`);
      progressCallback?.(60, 'SQLite veritabanına kaydediliyor...');

      // Store in SQLite database
      await sqliteHelper.setVersesBatch(versesArray, (progress) => {
        progressCallback?.(60 + progress * 0.35, `Kaydediliyor... %${Math.round(progress)}`);
      });

      // Mark as complete
      await sqliteHelper.setMeta(META_VERSION_KEY, CURRENT_VERSION);

      // Clean up old AsyncStorage data if exists
      try {
        await AsyncStorage.removeItem(META_VERSION_KEY);
        await AsyncStorage.removeItem(LEGACY_CACHE_KEY);
      } catch (cleanupError) {
        logger.warn('⚠️ Error cleaning up old AsyncStorage:', cleanupError);
      }

      logger.debug('✅ Data stored in SQLite successfully');
      progressCallback?.(100, 'Tamamlandı!');
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

// Complete Surah metadata (all 114 surahs) with Turkish names
const SURAH_METADATA = [
  { number: 1, name: 'Fatiha', arabicName: 'الْفَاتِحَة', revelationPlace: 'Mekkî', verseCount: 7 },
  { number: 2, name: 'Bakara', arabicName: 'الْبَقَرَة', revelationPlace: 'Medenî', verseCount: 286 },
  { number: 3, name: 'Al-i İmran', arabicName: 'آل عِمْرَان', revelationPlace: 'Medenî', verseCount: 200 },
  { number: 4, name: 'Nisa', arabicName: 'النِّسَاء', revelationPlace: 'Medenî', verseCount: 176 },
  { number: 5, name: 'Maide', arabicName: 'الْمَائِدَة', revelationPlace: 'Medenî', verseCount: 120 },
  { number: 6, name: 'Enam', arabicName: 'الْأَنْعَام', revelationPlace: 'Mekkî', verseCount: 165 },
  { number: 7, name: 'Araf', arabicName: 'الْأَعْرَاف', revelationPlace: 'Mekkî', verseCount: 206 },
  { number: 8, name: 'Enfal', arabicName: 'الْأَنْفَال', revelationPlace: 'Medenî', verseCount: 75 },
  { number: 9, name: 'Tevbe', arabicName: 'التَّوْبَة', revelationPlace: 'Medenî', verseCount: 129 },
  { number: 10, name: 'Yunus', arabicName: 'يُونُس', revelationPlace: 'Mekkî', verseCount: 109 },
  { number: 11, name: 'Hud', arabicName: 'هُود', revelationPlace: 'Mekkî', verseCount: 123 },
  { number: 12, name: 'Yusuf', arabicName: 'يُوسُف', revelationPlace: 'Mekkî', verseCount: 111 },
  { number: 13, name: 'Rad', arabicName: 'الرَّعْد', revelationPlace: 'Medenî', verseCount: 43 },
  { number: 14, name: 'İbrahim', arabicName: 'إِبْرَاهِيم', revelationPlace: 'Mekkî', verseCount: 52 },
  { number: 15, name: 'Hicr', arabicName: 'الْحِجْر', revelationPlace: 'Mekkî', verseCount: 99 },
  { number: 16, name: 'Nahl', arabicName: 'النَّحْل', revelationPlace: 'Mekkî', verseCount: 128 },
  { number: 17, name: 'İsra', arabicName: 'الْإِسْرَاء', revelationPlace: 'Mekkî', verseCount: 111 },
  { number: 18, name: 'Kehf', arabicName: 'الْكَهْف', revelationPlace: 'Mekkî', verseCount: 110 },
  { number: 19, name: 'Meryem', arabicName: 'مَرْيَم', revelationPlace: 'Mekkî', verseCount: 98 },
  { number: 20, name: 'Taha', arabicName: 'طه', revelationPlace: 'Mekkî', verseCount: 135 },
  { number: 21, name: 'Enbiya', arabicName: 'الْأَنْبِيَاء', revelationPlace: 'Mekkî', verseCount: 112 },
  { number: 22, name: 'Hac', arabicName: 'الْحَجّ', revelationPlace: 'Medenî', verseCount: 78 },
  { number: 23, name: 'Muminun', arabicName: 'الْمُؤْمِنُون', revelationPlace: 'Mekkî', verseCount: 118 },
  { number: 24, name: 'Nur', arabicName: 'النُّور', revelationPlace: 'Medenî', verseCount: 64 },
  { number: 25, name: 'Furkan', arabicName: 'الْفُرْقَان', revelationPlace: 'Mekkî', verseCount: 77 },
  { number: 26, name: 'Şuara', arabicName: 'الشُّعَرَاء', revelationPlace: 'Mekkî', verseCount: 227 },
  { number: 27, name: 'Neml', arabicName: 'النَّمْل', revelationPlace: 'Mekkî', verseCount: 93 },
  { number: 28, name: 'Kasas', arabicName: 'الْقَصَص', revelationPlace: 'Mekkî', verseCount: 88 },
  { number: 29, name: 'Ankebut', arabicName: 'الْعَنْكَبُوت', revelationPlace: 'Mekkî', verseCount: 69 },
  { number: 30, name: 'Rum', arabicName: 'الرُّوم', revelationPlace: 'Mekkî', verseCount: 60 },
  { number: 31, name: 'Lokman', arabicName: 'لُقْمَان', revelationPlace: 'Mekkî', verseCount: 34 },
  { number: 32, name: 'Secde', arabicName: 'السَّجْدَة', revelationPlace: 'Mekkî', verseCount: 30 },
  { number: 33, name: 'Ahzab', arabicName: 'الْأَحْزَاب', revelationPlace: 'Medenî', verseCount: 73 },
  { number: 34, name: 'Sebe', arabicName: 'سَبَأ', revelationPlace: 'Mekkî', verseCount: 54 },
  { number: 35, name: 'Fatır', arabicName: 'فَاطِر', revelationPlace: 'Mekkî', verseCount: 45 },
  { number: 36, name: 'Yasin', arabicName: 'يس', revelationPlace: 'Mekkî', verseCount: 83 },
  { number: 37, name: 'Saffat', arabicName: 'الصَّافَّات', revelationPlace: 'Mekkî', verseCount: 182 },
  { number: 38, name: 'Sad', arabicName: 'ص', revelationPlace: 'Mekkî', verseCount: 88 },
  { number: 39, name: 'Zümer', arabicName: 'الزُّمَر', revelationPlace: 'Mekkî', verseCount: 75 },
  { number: 40, name: 'Mümin', arabicName: 'غَافِر', revelationPlace: 'Mekkî', verseCount: 85 },
  { number: 41, name: 'Fussilet', arabicName: 'فُصِّلَت', revelationPlace: 'Mekkî', verseCount: 54 },
  { number: 42, name: 'Şura', arabicName: 'الشُّورَى', revelationPlace: 'Mekkî', verseCount: 53 },
  { number: 43, name: 'Zuhruf', arabicName: 'الزُّخْرُف', revelationPlace: 'Mekkî', verseCount: 89 },
  { number: 44, name: 'Duhan', arabicName: 'الدُّخَان', revelationPlace: 'Mekkî', verseCount: 59 },
  { number: 45, name: 'Casiye', arabicName: 'الْجَاثِيَة', revelationPlace: 'Mekkî', verseCount: 37 },
  { number: 46, name: 'Ahkaf', arabicName: 'الْأَحْقَاف', revelationPlace: 'Mekkî', verseCount: 35 },
  { number: 47, name: 'Muhammed', arabicName: 'مُحَمَّد', revelationPlace: 'Medenî', verseCount: 38 },
  { number: 48, name: 'Fetih', arabicName: 'الْفَتْح', revelationPlace: 'Medenî', verseCount: 29 },
  { number: 49, name: 'Hucurat', arabicName: 'الْحُجُرَات', revelationPlace: 'Medenî', verseCount: 18 },
  { number: 50, name: 'Kaf', arabicName: 'ق', revelationPlace: 'Mekkî', verseCount: 45 },
  { number: 51, name: 'Zariyat', arabicName: 'الذَّارِيَات', revelationPlace: 'Mekkî', verseCount: 60 },
  { number: 52, name: 'Tur', arabicName: 'الطُّور', revelationPlace: 'Mekkî', verseCount: 49 },
  { number: 53, name: 'Necm', arabicName: 'النَّجْم', revelationPlace: 'Mekkî', verseCount: 62 },
  { number: 54, name: 'Kamer', arabicName: 'الْقَمَر', revelationPlace: 'Mekkî', verseCount: 55 },
  { number: 55, name: 'Rahman', arabicName: 'الرَّحْمَن', revelationPlace: 'Medenî', verseCount: 78 },
  { number: 56, name: 'Vakia', arabicName: 'الْوَاقِعَة', revelationPlace: 'Mekkî', verseCount: 96 },
  { number: 57, name: 'Hadid', arabicName: 'الْحَدِيد', revelationPlace: 'Medenî', verseCount: 29 },
  { number: 58, name: 'Mücadele', arabicName: 'الْمُجَادَلَة', revelationPlace: 'Medenî', verseCount: 22 },
  { number: 59, name: 'Haşr', arabicName: 'الْحَشْر', revelationPlace: 'Medenî', verseCount: 24 },
  { number: 60, name: 'Mümtehine', arabicName: 'الْمُمْتَحَنَة', revelationPlace: 'Medenî', verseCount: 13 },
  { number: 61, name: 'Saff', arabicName: 'الصَّف', revelationPlace: 'Medenî', verseCount: 14 },
  { number: 62, name: 'Cuma', arabicName: 'الْجُمُعَة', revelationPlace: 'Medenî', verseCount: 11 },
  { number: 63, name: 'Münafikun', arabicName: 'الْمُنَافِقُون', revelationPlace: 'Medenî', verseCount: 11 },
  { number: 64, name: 'Teğabün', arabicName: 'التَّغَابُن', revelationPlace: 'Medenî', verseCount: 18 },
  { number: 65, name: 'Talak', arabicName: 'الطَّلَاق', revelationPlace: 'Medenî', verseCount: 12 },
  { number: 66, name: 'Tahrim', arabicName: 'التَّحْرِيم', revelationPlace: 'Medenî', verseCount: 12 },
  { number: 67, name: 'Mülk', arabicName: 'الْمُلْك', revelationPlace: 'Mekkî', verseCount: 30 },
  { number: 68, name: 'Kalem', arabicName: 'الْقَلَم', revelationPlace: 'Mekkî', verseCount: 52 },
  { number: 69, name: 'Hakka', arabicName: 'الْحَاقَّة', revelationPlace: 'Mekkî', verseCount: 52 },
  { number: 70, name: 'Mearic', arabicName: 'الْمَعَارِج', revelationPlace: 'Mekkî', verseCount: 44 },
  { number: 71, name: 'Nuh', arabicName: 'نُوح', revelationPlace: 'Mekkî', verseCount: 28 },
  { number: 72, name: 'Cin', arabicName: 'الْجِنّ', revelationPlace: 'Mekkî', verseCount: 28 },
  { number: 73, name: 'Müzzemmil', arabicName: 'الْمُزَّمِّل', revelationPlace: 'Mekkî', verseCount: 20 },
  { number: 74, name: 'Müddessir', arabicName: 'الْمُدَّثِّر', revelationPlace: 'Mekkî', verseCount: 56 },
  { number: 75, name: 'Kıyamet', arabicName: 'الْقِيَامَة', revelationPlace: 'Mekkî', verseCount: 40 },
  { number: 76, name: 'İnsan', arabicName: 'الْإِنْسَان', revelationPlace: 'Medenî', verseCount: 31 },
  { number: 77, name: 'Mürselat', arabicName: 'الْمُرْسَلَات', revelationPlace: 'Mekkî', verseCount: 50 },
  { number: 78, name: 'Nebe', arabicName: 'النَّبَأ', revelationPlace: 'Mekkî', verseCount: 40 },
  { number: 79, name: 'Naziat', arabicName: 'النَّازِعَات', revelationPlace: 'Mekkî', verseCount: 46 },
  { number: 80, name: 'Abese', arabicName: 'عَبَسَ', revelationPlace: 'Mekkî', verseCount: 42 },
  { number: 81, name: 'Tekvir', arabicName: 'التَّكْوِير', revelationPlace: 'Mekkî', verseCount: 29 },
  { number: 82, name: 'İnfitar', arabicName: 'الْإِنْفِطَار', revelationPlace: 'Mekkî', verseCount: 19 },
  { number: 83, name: 'Mutaffifin', arabicName: 'الْمُطَفِّفِين', revelationPlace: 'Mekkî', verseCount: 36 },
  { number: 84, name: 'İnşikak', arabicName: 'الْإِنْشِقَاق', revelationPlace: 'Mekkî', verseCount: 25 },
  { number: 85, name: 'Buruc', arabicName: 'الْبُرُوج', revelationPlace: 'Mekkî', verseCount: 22 },
  { number: 86, name: 'Tarık', arabicName: 'الطَّارِق', revelationPlace: 'Mekkî', verseCount: 17 },
  { number: 87, name: 'Ala', arabicName: 'الْأَعْلَى', revelationPlace: 'Mekkî', verseCount: 19 },
  { number: 88, name: 'Gaşiye', arabicName: 'الْغَاشِيَة', revelationPlace: 'Mekkî', verseCount: 26 },
  { number: 89, name: 'Fecr', arabicName: 'الْفَجْر', revelationPlace: 'Mekkî', verseCount: 30 },
  { number: 90, name: 'Beled', arabicName: 'الْبَلَد', revelationPlace: 'Mekkî', verseCount: 20 },
  { number: 91, name: 'Şems', arabicName: 'الشَّمْس', revelationPlace: 'Mekkî', verseCount: 15 },
  { number: 92, name: 'Leyl', arabicName: 'اللَّيْل', revelationPlace: 'Mekkî', verseCount: 21 },
  { number: 93, name: 'Duha', arabicName: 'الضُّحَى', revelationPlace: 'Mekkî', verseCount: 11 },
  { number: 94, name: 'İnşirah', arabicName: 'الشَّرْح', revelationPlace: 'Mekkî', verseCount: 8 },
  { number: 95, name: 'Tin', arabicName: 'التِّين', revelationPlace: 'Mekkî', verseCount: 8 },
  { number: 96, name: 'Alak', arabicName: 'الْعَلَق', revelationPlace: 'Mekkî', verseCount: 19 },
  { number: 97, name: 'Kadir', arabicName: 'الْقَدْر', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 98, name: 'Beyyine', arabicName: 'الْبَيِّنَة', revelationPlace: 'Medenî', verseCount: 8 },
  { number: 99, name: 'Zilzal', arabicName: 'الزَّلْزَلَة', revelationPlace: 'Medenî', verseCount: 8 },
  { number: 100, name: 'Adiyat', arabicName: 'الْعَادِيَات', revelationPlace: 'Mekkî', verseCount: 11 },
  { number: 101, name: 'Karia', arabicName: 'الْقَارِعَة', revelationPlace: 'Mekkî', verseCount: 11 },
  { number: 102, name: 'Tekasür', arabicName: 'التَّكَاثُر', revelationPlace: 'Mekkî', verseCount: 8 },
  { number: 103, name: 'Asr', arabicName: 'الْعَصْر', revelationPlace: 'Mekkî', verseCount: 3 },
  { number: 104, name: 'Hümeze', arabicName: 'الْهُمَزَة', revelationPlace: 'Mekkî', verseCount: 9 },
  { number: 105, name: 'Fil', arabicName: 'الْفِيل', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 106, name: 'Kureyş', arabicName: 'قُرَيْش', revelationPlace: 'Mekkî', verseCount: 4 },
  { number: 107, name: 'Maun', arabicName: 'الْمَاعُون', revelationPlace: 'Mekkî', verseCount: 7 },
  { number: 108, name: 'Kevser', arabicName: 'الْكَوْثَر', revelationPlace: 'Mekkî', verseCount: 3 },
  { number: 109, name: 'Kafirun', arabicName: 'الْكَافِرُون', revelationPlace: 'Mekkî', verseCount: 6 },
  { number: 110, name: 'Nasr', arabicName: 'النَّصْر', revelationPlace: 'Medenî', verseCount: 3 },
  { number: 111, name: 'Tebbet', arabicName: 'الْمَسَد', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 112, name: 'İhlas', arabicName: 'الْإِخْلَاص', revelationPlace: 'Mekkî', verseCount: 4 },
  { number: 113, name: 'Felak', arabicName: 'الْفَلَق', revelationPlace: 'Mekkî', verseCount: 5 },
  { number: 114, name: 'Nas', arabicName: 'النَّاس', revelationPlace: 'Mekkî', verseCount: 6 }];

// Cache for loaded surahs
const loadedSurahs = new Map<number, Surah>();

// Load verses for a specific surah - optimized for IndexedDB and SQLite
async function loadSurahVerses(surahNumber: number): Promise<Verse[]> {
  const surahMeta = SURAH_METADATA.find(s => s.number === surahNumber);
  if (!surahMeta) return [];

  if (Platform.OS === 'web') {
    // Use IndexedDB batch fetch for better performance
    const versesData = await idbHelper.getSurahVerses(surahNumber);
    return versesData.map(convertToAppFormat);
  } else {
    // Use SQLite batch fetch for mobile
    const versesData = await sqliteHelper.getSurahVerses(surahNumber);
    return versesData.map(convertToAppFormat);
  }
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

// Clear cached data version to force a re-download
export const clearCachedData = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await idbHelper.setMeta(META_VERSION_KEY, '');
    } else {
      await sqliteHelper.setMeta(META_VERSION_KEY, '');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Get stored data version
export const getStoredDataVersion = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await idbHelper.getMeta(META_VERSION_KEY);
    } else {
      return await sqliteHelper.getMeta(META_VERSION_KEY);
    }
  } catch (error) {
    return null;
  }
};

export default quranData;
