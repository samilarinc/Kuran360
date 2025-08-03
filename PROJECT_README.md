# Quran App - React Native

A React Native application for reading the Quran with verse-by-verse audio playback and Turkish translations.

## Features

### Current Implementation ✅
- **Surah List**: Browse all chapters of the Quran
- **Verse Display**: View Arabic text with Turkish translations
- **Audio Playback**: Play individual verses with Abdul Rahman Al-Sudais recitation
- **Navigation**: Navigate between surahs and verses
- **Modern UI**: Clean, Islamic-themed interface

### Next Steps 🚀

#### 1. Complete Quran Data
- **Add all 114 surahs** with complete verse data
- **Add Turkish translations** for all verses (currently only Al-Fatiha and first few verses of Al-Baqarah are complete)
- **Integrate your existing audio files** (you have 6,349 files ready)

#### 2. Enhanced Audio Features
- **Continuous playback**: Play multiple verses in sequence  
- **Auto-advance**: Automatically move to next verse after completion
- **Playback controls**: Seek, speed control, repeat modes
- **Background playback**: Continue playing when app is minimized
- **Surah introduction audio**: Play surah introductions (000 files)

#### 3. Additional Features
- **Bookmarks**: Save favorite verses
- **Search functionality**: Search in Arabic text and translations
- **Different translations**: Add multiple Turkish translations
- **Different reciters**: Support multiple Qaris
- **Offline mode**: Download verses for offline use
- **Prayer times**: Integrate Islamic prayer times
- **Qibla direction**: Show direction to Mecca
- **Daily verses**: Featured verse of the day

#### 4. Data Integration
- **Import your audio files**: 
  ```bash
  # Copy all your audio files to the app
  cp /home/samil/quran/sudais_all_verse/*.mp3 /home/samil/quran/QuranApp/assets/audio/
  ```
- **Complete translation data**: Add Turkish translations for all verses
- **Audio file management**: Implement efficient loading and caching

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Verse.tsx       # Individual verse display
│   └── SurahList.tsx   # List of surahs
├── screens/            # App screens
│   ├── HomeScreen.tsx  # Main surah list
│   └── SurahDetailScreen.tsx # Verse details
├── navigation/         # Navigation setup
├── hooks/             # Custom React hooks
│   └── useAudioPlayer.ts # Audio playback management
├── utils/             # Utility functions
│   ├── audioManager.ts # Audio player wrapper
│   └── dataHelpers.ts # Data manipulation helpers
├── data/              # Static data
│   └── quranData.ts   # Quran verses and translations
├── types/             # TypeScript definitions
├── constants/         # App constants and styling
```

## Development Setup

1. **Install dependencies**:
   ```bash
   cd /home/samil/quran/QuranApp
   npm install
   ```

2. **Run the app**:
   ```bash
   # For Android
   npx react-native run-android
   
   # For iOS (if on macOS)
   npx react-native run-ios
   ```

## Audio File Integration

Your audio files follow the pattern `SSSAAA.mp3` where:
- `SSS` = Surah number (001-114)
- `AAA` = Verse number (001-286) or 000 for surah introduction

Example: `001001.mp3` = Surah 1, Verse 1 (Al-Fatiha, first verse)

## Adding Turkish Translations

To add more Turkish translations, update `src/data/quranData.ts`:

```typescript
{
  surahNumber: 2,
  verseNumber: 4,
  arabicText: 'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ',
  turkishTranslation: 'Onlar sana indirilene, senden önce indirilenlere iman ederler ve ahiretten de kesin olarak emin olurlar.',
  audioFileName: '002004.mp3',
}
```

## Technologies Used

- **React Native 0.80+**
- **TypeScript**
- **React Navigation 6**
- **React Native Track Player** (Audio playback)
- **React Native Vector Icons**

## Performance Considerations

- Audio files are loaded on-demand
- Large surah data is efficiently managed
- Smooth scrolling with FlatList optimization
- Memory-efficient audio player

## Contributing

1. Complete the Quran data with all verses and translations
2. Integrate all 6,349 audio files
3. Add more features from the roadmap
4. Improve UI/UX design
5. Add tests

## License

This project is for educational and religious purposes.
