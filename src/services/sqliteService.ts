import * as SQLite from 'expo-sqlite';
import logger from '../utils/logger';

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

const DB_NAME = 'quran.db';
const DB_VERSION = 1;

class SQLiteHelper {
    private db: SQLite.SQLiteDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    // Initialize database and create tables if needed
    async initDB(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                logger.debug('🗄️ Opening SQLite database...');
                this.db = await SQLite.openDatabaseAsync(DB_NAME);

                // Create verses table with composite primary key
                await this.db.execAsync(`
          CREATE TABLE IF NOT EXISTS verses (
            surah_number INTEGER NOT NULL,
            verse_number INTEGER NOT NULL,
            url TEXT,
            arabic_text TEXT NOT NULL,
            transliteration TEXT,
            word_translations TEXT,
            translations TEXT,
            PRIMARY KEY (surah_number, verse_number)
          );
        `);

                // Create index for faster surah lookups
                await this.db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_surah_number ON verses(surah_number);
        `);

                // Create metadata table
                await this.db.execAsync(`
          CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
          );
        `);

                logger.debug('✅ SQLite database initialized');
            } catch (error) {
                logger.error('❌ Error initializing SQLite:', error);
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    // Get a single verse
    async getVerse(surahNumber: number, verseNumber: number): Promise<VerseData | null> {
        try {
            await this.initDB();
            if (!this.db) return null;

            const result = await this.db.getFirstAsync<{
                surah_number: number;
                verse_number: number;
                url: string;
                arabic_text: string;
                transliteration: string;
                word_translations: string;
                translations: string;
            }>(
                'SELECT * FROM verses WHERE surah_number = ? AND verse_number = ?',
                [surahNumber, verseNumber]
            );

            if (!result) return null;

            return {
                surah_number: result.surah_number,
                verse_number: result.verse_number,
                url: result.url,
                arabic_text: result.arabic_text,
                transliteration: result.transliteration,
                word_translations: JSON.parse(result.word_translations || '[]'),
                translations: JSON.parse(result.translations || '{}')
            };
        } catch (error) {
            logger.error('Error getting verse from SQLite:', error);
            return null;
        }
    }

    // Get all verses for a surah
    async getSurahVerses(surahNumber: number): Promise<VerseData[]> {
        try {
            await this.initDB();
            if (!this.db) return [];

            const results = await this.db.getAllAsync<{
                surah_number: number;
                verse_number: number;
                url: string;
                arabic_text: string;
                transliteration: string;
                word_translations: string;
                translations: string;
            }>(
                'SELECT * FROM verses WHERE surah_number = ? ORDER BY verse_number ASC',
                [surahNumber]
            );

            return results.map(row => ({
                surah_number: row.surah_number,
                verse_number: row.verse_number,
                url: row.url,
                arabic_text: row.arabic_text,
                transliteration: row.transliteration,
                word_translations: JSON.parse(row.word_translations || '[]'),
                translations: JSON.parse(row.translations || '{}')
            }));
        } catch (error) {
            logger.error('Error getting surah verses from SQLite:', error);
            return [];
        }
    }

    // Store a single verse
    async setVerse(verse: VerseData): Promise<void> {
        try {
            await this.initDB();
            if (!this.db) throw new Error('Database not initialized');

            await this.db.runAsync(
                `INSERT OR REPLACE INTO verses 
         (surah_number, verse_number, url, arabic_text, transliteration, word_translations, translations)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    verse.surah_number,
                    verse.verse_number,
                    verse.url,
                    verse.arabic_text,
                    verse.transliteration,
                    JSON.stringify(verse.word_translations || []),
                    JSON.stringify(verse.translations || {})
                ]
            );
        } catch (error) {
            logger.error('Error storing verse in SQLite:', error);
            throw error;
        }
    }

    // Store multiple verses in batch (for initial load)
    async setVersesBatch(verses: VerseData[], progressCallback?: (progress: number) => void): Promise<void> {
        try {
            await this.initDB();
            if (!this.db) throw new Error('Database not initialized');

            const totalVerses = verses.length;
            const batchSize = 100; // Insert in batches for better performance

            logger.debug(`📥 Starting batch insert of ${totalVerses} verses...`);

            for (let i = 0; i < verses.length; i += batchSize) {
                const batch = verses.slice(i, i + batchSize);

                // Use transaction for better performance
                await this.db.withTransactionAsync(async () => {
                    for (const verse of batch) {
                        await this.db!.runAsync(
                            `INSERT OR REPLACE INTO verses 
               (surah_number, verse_number, url, arabic_text, transliteration, word_translations, translations)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                verse.surah_number,
                                verse.verse_number,
                                verse.url,
                                verse.arabic_text,
                                verse.transliteration,
                                JSON.stringify(verse.word_translations || []),
                                JSON.stringify(verse.translations || {})
                            ]
                        );
                    }
                });

                const processed = i + batch.length;
                const progress = (processed / totalVerses) * 100;
                progressCallback?.(progress);
                logger.debug(`📊 Progress: ${processed}/${totalVerses} (${progress.toFixed(1)}%)`);
            }

            logger.debug('✅ Batch insert complete');
        } catch (error) {
            logger.error('Error batch storing verses in SQLite:', error);
            throw error;
        }
    }

    // Get metadata value
    async getMeta(key: string): Promise<string | null> {
        try {
            await this.initDB();
            if (!this.db) return null;

            const result = await this.db.getFirstAsync<{ value: string }>(
                'SELECT value FROM metadata WHERE key = ?',
                [key]
            );

            return result?.value || null;
        } catch (error) {
            logger.error('Error getting metadata from SQLite:', error);
            return null;
        }
    }

    // Set metadata value
    async setMeta(key: string, value: string): Promise<void> {
        try {
            await this.initDB();
            if (!this.db) throw new Error('Database not initialized');

            await this.db.runAsync(
                'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
                [key, value]
            );
        } catch (error) {
            logger.error('Error setting metadata in SQLite:', error);
            throw error;
        }
    }

    // Get verse count
    async getVerseCount(): Promise<number> {
        try {
            await this.initDB();
            if (!this.db) return 0;

            const result = await this.db.getFirstAsync<{ count: number }>(
                'SELECT COUNT(*) as count FROM verses'
            );

            return result?.count || 0;
        } catch (error) {
            logger.error('Error getting verse count from SQLite:', error);
            return 0;
        }
    }

    // Check if database has data
    async hasData(): Promise<boolean> {
        const count = await this.getVerseCount();
        return count > 0;
    }

    // Clear all data (for testing/reset)
    async clearAll(): Promise<void> {
        try {
            await this.initDB();
            if (!this.db) return;

            await this.db.execAsync('DELETE FROM verses');
            await this.db.execAsync('DELETE FROM metadata');

            logger.debug('🗑️ SQLite database cleared');
        } catch (error) {
            logger.error('Error clearing SQLite:', error);
            throw error;
        }
    }

    // Close database (if needed)
    async close(): Promise<void> {
        if (this.db) {
            await this.db.closeAsync();
            this.db = null;
            this.initPromise = null;
            logger.debug('🔒 SQLite database closed');
        }
    }
}

// Export singleton instance
export const sqliteHelper = new SQLiteHelper();
export default sqliteHelper;
