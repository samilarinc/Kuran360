import { QuranData, Surah, Verse } from '../types';
import allVerses from './allVerses.json';

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
        }))
    };
}

// Function to load a single verse from the combined JSON
function requireVerse(surahNumber: number, verseNumber: number): any | null {
    const fileName = `${surahNumber.toString().padStart(3, '0')}${verseNumber.toString().padStart(3, '0')}`;
    return (allVerses as any)[fileName] || null;
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
    // Add all remaining surahs...
    { number: 114, name: 'An-Nās', arabicName: 'النَّاس', englishName: 'Mankind', revelationPlace: 'Mecca', verseCount: 6 }
];

// Cache for loaded surahs
const loadedSurahs = new Map<number, Surah>();

// Load verses for a specific surah
function loadSurahVerses(surahNumber: number): Verse[] {
    const surahMeta = SURAH_METADATA.find(s => s.number === surahNumber);
    if (!surahMeta) return [];

    const verses: Verse[] = [];
    
    for (let verseNumber = 1; verseNumber <= surahMeta.verseCount; verseNumber++) {
        const verseData = requireVerse(surahNumber, verseNumber);
        if (verseData) {
            verses.push(convertToAppFormat(verseData));
        }
    }
    
    return verses;
}

// Load a single surah
export function loadSurah(surahNumber: number): Surah | null {
    if (loadedSurahs.has(surahNumber)) {
        return loadedSurahs.get(surahNumber)!;
    }

    const surahMeta = SURAH_METADATA.find(s => s.number === surahNumber);
    if (!surahMeta) return null;

    const verses = loadSurahVerses(surahNumber);
    
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
