// Verse mapping for React Native Metro bundler compatibility
// Since dynamic require() doesn't work, we'll use a hybrid approach

// For demo purposes, let's hardcode a few sample verses from the first surah
const sampleVerses = {
    '001001': {
        "surah_number": 1,
        "verse_number": 1,
        "arabic_text": "بِسْمِاللَّهِاَلرَّحْمٰنِالرَّحِيمِ",
        "transliteration": "Bismillahirrahmanirrahim",
        "word_translations": [
            {
                "arabic": "بِسْمِ",
                "turkish": "Adıyla"
            },
            {
                "arabic": "اللَّهِ",
                "turkish": "Allah'ın"
            },
            {
                "arabic": "الرَّحْمٰنِ",
                "turkish": "Rahman olan"
            },
            {
                "arabic": "الرَّحِيمِ",
                "turkish": "Rahim olan"
            }
        ],
        "translations": {
            "Diyanet İşleri Meali": "Rahman ve Rahim olan Allah'ın adıyla.",
            "Süleymaniye Vakfı Meali": "Rahman ve Rahim Allah'ın adıyla.",
            "Abdullah-Ahmet Akgül Meali": "Rahmân ve Rahîm olan Allah'ın adıyla."
        }
    },
    '001002': {
        "surah_number": 1,
        "verse_number": 2,
        "arabic_text": "اَلْحَمْدُلِلّٰهِرَبِّالْعَالَمِينَۙ",
        "transliteration": "Elhamdulillahi rabbil alemin",
        "word_translations": [
            {
                "arabic": "اَلْحَمْدُ",
                "turkish": "Hamd"
            },
            {
                "arabic": "لِلّٰهِ",
                "turkish": "Allah'a mahsustur"
            },
            {
                "arabic": "رَبِّ",
                "turkish": "Rabbi olan"
            },
            {
                "arabic": "الْعَالَمِينَ",
                "turkish": "Alemlerin"
            }
        ],
        "translations": {
            "Diyanet İşleri Meali": "Hamd, âlemlerin Rabbi Allah'a mahsustur.",
            "Süleymaniye Vakfı Meali": "Övgü, âlemlerin Rabbi Allah'a mahsustur.",
            "Abdullah-Ahmet Akgül Meali": "Hamd âlemlerin Rabbi Allah'ındır."
        }
    }
};

export function getVerse(surahNumber: number, verseNumber: number): any | null {
    const fileName = `${surahNumber.toString().padStart(3, '0')}${verseNumber.toString().padStart(3, '0')}`;
    return sampleVerses[fileName as keyof typeof sampleVerses] || null;
}

// Note: For production, you would need to either:
// 1. Use a bundler that supports dynamic imports
// 2. Create a script to generate static imports for all 6000+ files
// 3. Use a different data loading strategy (like bundling into a single JSON file)
// 4. Use React Native's asset system differently
