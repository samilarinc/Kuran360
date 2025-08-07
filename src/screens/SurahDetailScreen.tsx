import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Verse, PaginatedVerseView } from '../components';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { AutoplayToggle } from '../components/AutoplayToggle';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { Surah, Verse as VerseType } from '../types';
import { loadSurah } from '../data/quranData';
import { FONT_SIZES, SPACING } from '../constants';

interface SurahDetailScreenProps {
  route: {
    params: {
      surah: Surah;
      verseIndex?: number;
    };
  };
  navigation: any;
  updateVerseUrl?: (surah: Surah, verseIndex?: number) => void;
}

export const SurahDetailScreen: React.FC<SurahDetailScreenProps> = ({
  route,
  navigation,
  updateVerseUrl
}) => {
  const { surah: basicSurah } = route.params;
  const [surah, setSurah] = useState<Surah>(basicSurah);
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { theme } = useTheme();
  const { audioState, playVerse, stop, setVersesForAutoplay } = useAudioPlayer();

  useEffect(() => {
    const loadSurahData = async () => {
      try {
        setLoading(true);

        // Load the full surah with verses if not already loaded
        if (basicSurah.verses.length === 0) {
          const loadedSurah = await loadSurah(basicSurah.number);
          if (loadedSurah) {
            setSurah(loadedSurah);
            // Set verses for autoplay functionality
            setVersesForAutoplay(loadedSurah.verses);
          }
        } else {
          setSurah(basicSurah);
          // Set verses for autoplay functionality
          setVersesForAutoplay(basicSurah.verses);
        }
      } catch (error) {
        console.error('Error loading surah verses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSurahData();
  }, [basicSurah, setVersesForAutoplay]);

  const handleVersePress = (verse: VerseType) => {
    const isCurrentVersePlaying = audioState.currentVerse?.surahNumber === verse.surahNumber &&
      audioState.currentVerse?.number === verse.number &&
      audioState.isPlaying;

    if (isCurrentVersePlaying) {
      // If this verse is currently playing, stop it
      stop();
    } else {
      // If this verse is not playing, play it
      playVerse(verse);
    }
  };

  const isVerseCurrentlyPlaying = (verse: VerseType) => {
    return audioState.currentVerse?.surahNumber === verse.surahNumber &&
      audioState.currentVerse?.number === verse.number &&
      audioState.isPlaying;
  };

  const handleVerseChange = (verseIndex: number) => {
    // Update URL to reflect current verse
    if (updateVerseUrl) {
      updateVerseUrl(surah, verseIndex);
    }

    // Don't auto-play on verse change in paginated view
    // Users can manually tap the play button if they want to hear the verse
    console.log('Verse changed to:', verseIndex + 1);
  };

  const renderVerse = ({ item }: { item: VerseType }) => (
    <Verse
      verse={item}
      isPlaying={isVerseCurrentlyPlaying(item)}
      onPlayPress={handleVersePress}
    />
  );

  return (
    <SafeAreaView style={createStyles(theme).container}>
      {loading ? (
        <View style={createStyles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={createStyles(theme).loadingText}>Ayetler yükleniyor...</Text>
          <Text style={createStyles(theme).loadingNote}>(Bu işlem sadece bir kez yapılır)</Text>
        </View>
      ) : (
        <>
          <HeaderWithDarkModeToggle
            title={surah.arabicName}
            subtitle={`${surah.turkishName || surah.name} • ${surah.verseCount} ayet • ${surah.revelationPlace}`}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
            autoplayToggle={
              <AutoplayToggle
                isEnabled={settings.autoplayEnabled}
                onToggle={(enabled) => updateSettings({ autoplayEnabled: enabled })}
              />
            }
          />

          {/* Conditional rendering based on settings */}
          {settings.usePaginatedView ? (
            <PaginatedVerseView
              verses={surah.verses}
              initialVerseIndex={route.params.verseIndex}
              onVerseChange={handleVerseChange}
              onPlayAudio={handleVersePress}
              audioState={audioState}
            />
          ) : (
            <FlatList
              data={surah.verses}
              renderItem={renderVerse}
              keyExtractor={(item) => `${item.surahNumber}-${item.number}`}
              contentContainerStyle={createStyles(theme).listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}

          {audioState.currentVerse && !settings.usePaginatedView && (
            <View style={createStyles(theme).audioInfo}>
              <Text style={createStyles(theme).audioInfoText}>
                {audioState.isLoading
                  ? 'Yükleniyor...'
                  : `${audioState.isPlaying ? 'Çalıyor' : 'Duraklatıldı'}: ${audioState.currentVerse.number}. Ayet`
                }
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.medium,
    color: theme.textSecondary,
  },
  loadingNote: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.small,
    color: theme.textSecondary,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
  audioInfo: {
    backgroundColor: theme.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  audioInfoText: {
    color: theme.headerText,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
  },
});
