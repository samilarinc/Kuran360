// Simple test script to verify verse loading
const { loadSurah } = require('./src/data/quranData');

console.log('Testing verse loading...');

try {
    // Test loading the first surah (Al-Fatiha)
    const surah1 = loadSurah(1);
    if (surah1) {
        console.log(`✅ Successfully loaded Surah 1: ${surah1.name}`);
        console.log(`   Verses loaded: ${surah1.verses.length}`);
        if (surah1.verses.length > 0) {
            console.log(`   First verse: ${surah1.verses[0].arabicText}`);
        }
    } else {
        console.log('❌ Failed to load Surah 1');
    }
} catch (error) {
    console.error('❌ Error testing verse loading:', error.message);
}
