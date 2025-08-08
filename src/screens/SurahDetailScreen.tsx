import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useGlobalAudio } from '../contexts/AudioContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
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
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  // Persist current verse index for the active surah to survive remounts
  const [currentPaginatedIndex, setCurrentPaginatedIndex] = useState<number>(route.params.verseIndex ?? 0);
  const { settings, updateSettings } = useDebouncedSettings(200); // 200ms debounce for better UX
  const { theme } = useTheme();
  const { audioState, playVerse, stop, pause, resume, togglePlayPause, setVersesForAutoplay, changePlaybackRate } = useGlobalAudio();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadSurahData = async () => {
      try {
        // Only show loader if we actually fetch verses from disk

        // Auto-disable audio tracking when navigating to a different surah
        if (settings.audioTrackingEnabled && audioState.currentVerse &&
          audioState.currentVerse.surahNumber !== basicSurah.number) {
          updateSettings({ audioTrackingEnabled: false });
        }

        // Load the full surah with verses if not already loaded
        if (basicSurah.verses.length === 0) {
          setLoading(true);
          const loadedSurah = await loadSurah(basicSurah.number);
          if (loadedSurah) {
            setSurah(loadedSurah);
            // Set verses for autoplay functionality
            setVersesForAutoplay(loadedSurah.verses);
          }
          setLoading(false);
        } else {
          setSurah(basicSurah);
          // Set verses for autoplay functionality
          setVersesForAutoplay(basicSurah.verses);
        }
      } catch (error) {
        console.error('Error loading surah verses:', error);
      }
    };

    loadSurahData();
    // Reset the persisted index when the surah changes
    setCurrentPaginatedIndex(route.params.verseIndex ?? 0);
    // We only want to react to surah changes (by number). Avoid function-identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicSurah.number]);

  // Auto-scroll effect: scroll to the currently playing verse in non-paginated mode
  useEffect(() => {
    if (settings.audioTrackingEnabled &&
      audioState.currentVerse &&
      audioState.isPlaying &&
      !settings.usePaginatedView &&
      !isUserScrolling && // Don't auto-scroll if user is manually scrolling
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
      }, 250); // Increased debounce to 250ms for better stability

      return () => clearTimeout(timeoutId);
    }
  }, [audioState.currentVerse, audioState.isPlaying, settings.audioTrackingEnabled, settings.usePaginatedView, surah.verses, isUserScrolling]);

  const handleVersePress = (verse: VerseType) => {
    // Temporarily disable auto-tracking when user manually selects a verse
    setIsUserScrolling(true);

    const isCurrentVersePlaying = audioState.currentVerse?.surahNumber === verse.surahNumber &&
      audioState.currentVerse?.number === verse.number &&
      audioState.isPlaying;

    if (isCurrentVersePlaying) {
      // If this verse is currently playing, stop it
      stop();
    } else {
      // Auto-disable audio tracking when user manually selects a different verse
      if (settings.audioTrackingEnabled && audioState.currentVerse &&
        (audioState.currentVerse.surahNumber !== verse.surahNumber ||
          audioState.currentVerse.number !== verse.number)) {
        updateSettings({ audioTrackingEnabled: false });
      }

      // If this verse is not playing, play it
      playVerse(verse);
    }

    // Re-enable auto-tracking after a delay
    setTimeout(() => setIsUserScrolling(false), 2000);
  };

  const isVerseCurrentlyPlaying = (verse: VerseType) => {
    return audioState.currentVerse?.surahNumber === verse.surahNumber &&
      audioState.currentVerse?.number === verse.number &&
      audioState.isPlaying;
  };

  const handleVerseChange = (verseIndex: number) => {
    // Temporarily disable URL updates to prevent circular updates
    // TODO: Fix URL update mechanism to not cause re-renders
    // if (updateVerseUrl) {
    //   updateVerseUrl(surah, verseIndex);
    // }

    // Don't auto-play on verse change in paginated view
    // Users can manually tap the play button if they want to hear the verse
    console.log('Verse changed to:', verseIndex + 1, 'in surah:', surah.number);
    // Persist current index so PaginatedVerseView remounts won't reset to 0
    setCurrentPaginatedIndex(verseIndex);
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

  // Memoize styles to prevent re-creation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Ayetler yükleniyor...</Text>
          <Text style={styles.loadingNote}>(Bu işlem sadece bir kez yapılır)</Text>
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
              initialVerseIndex={currentPaginatedIndex}
              onVerseChange={handleVerseChange}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={surah.verses}
              renderItem={renderVerse}
              keyExtractor={(item) => `${item.surahNumber}-${item.number}`}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={() => {
                // User started scrolling manually
                setIsUserScrolling(true);
              }}
              onMomentumScrollEnd={() => {
                // User finished scrolling, re-enable auto-tracking after a delay
                setTimeout(() => setIsUserScrolling(false), 1000);
              }}
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
});
