import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Verse } from '../components/Verse';
import { PaginatedVerseView } from '../components/PaginatedVerseView';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { AutoplayToggle } from '../components/AutoplayToggle';
import { AudioTrackingToggle } from '../components/AudioTrackingToggle';
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
  const flatListRef = useRef<FlatList>(null);

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

  // Auto-scroll effect: scroll to the currently playing verse in non-paginated mode
  useEffect(() => {
    if (settings.audioTrackingEnabled && 
        audioState.currentVerse && 
        audioState.isPlaying && 
        !settings.usePaginatedView && 
        flatListRef.current) {
      
      // Debounce the scroll to prevent excessive calls
      const timeoutId = setTimeout(() => {
        // Find the index of the currently playing verse
        const playingVerseIndex = surah.verses.findIndex(verse =>
          verse.surahNumber === audioState.currentVerse!.surahNumber &&
          verse.number === audioState.currentVerse!.number
        );

        if (playingVerseIndex !== -1 && flatListRef.current) {
          // Scroll to the playing verse with animation
          flatListRef.current.scrollToIndex({
            index: playingVerseIndex,
            animated: true,
            viewPosition: 0.5, // Center the verse in the viewport
          });
        }
      }, 100); // 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [audioState.currentVerse, audioState.isPlaying, settings.audioTrackingEnabled, settings.usePaginatedView, surah.verses]);

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

  // Memoize toggle handlers to prevent unnecessary re-renders
  const handleAutoplayToggle = useCallback((enabled: boolean) => {
    updateSettings({ autoplayEnabled: enabled });
  }, [updateSettings]);

  const handleAudioTrackingToggle = useCallback((enabled: boolean) => {
    updateSettings({ audioTrackingEnabled: enabled });
  }, [updateSettings]);

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
                onToggle={handleAutoplayToggle}
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
              ref={flatListRef}
              data={surah.verses}
              renderItem={renderVerse}
              keyExtractor={(item) => `${item.surahNumber}-${item.number}`}
              contentContainerStyle={createStyles(theme).listContainer}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                // Handle scroll failure gracefully
                setTimeout(() => {
                  if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({
                      index: Math.min(info.index, surah.verses.length - 1),
                      animated: true,
                      viewPosition: 0.5,
                    });
                  }
                }, 100);
              }}
            />
          )}

          {/* Audio info bar - show in both paginated and non-paginated views when playing */}
          {audioState.currentVerse && (
            <View style={createStyles(theme).audioInfo}>
              <View style={createStyles(theme).audioInfoContent}>
                <Text style={createStyles(theme).audioInfoText}>
                  {audioState.isLoading
                    ? 'Yükleniyor...'
                    : `${audioState.isPlaying ? 'Çalıyor' : 'Duraklatıldı'}: ${audioState.currentVerse.number}. Ayet`
                  }
                </Text>
                <View style={createStyles(theme).audioTrackingContainer}>
                  <AudioTrackingToggle
                    isEnabled={settings.audioTrackingEnabled}
                    onToggle={handleAudioTrackingToggle}
                  />
                  <Text style={createStyles(theme).audioTrackingLabel}>
                    Otomatik takip
                  </Text>
                </View>
              </View>
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
  audioInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  audioInfoText: {
    color: theme.headerText,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    flex: 1,
    marginRight: SPACING.md,
  },
  audioTrackingContainer: {
    alignItems: 'center',
    gap: 4,
  },
  audioTrackingLabel: {
    color: theme.headerText,
    fontSize: FONT_SIZES.small,
    opacity: 0.8,
    textAlign: 'center',
  },
});
