import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, ScrollView, SafeAreaView, Platform } from 'react-native';
import { FontSizeToggle } from '@msarinc/ui';
import { Verse } from '@/components/Verse';
import { PaginatedVerseView } from '@/components/PaginatedVerseView';
import { AppHeader } from '@/components/AppHeader';
import { LoadingView } from '@/components/LoadingView';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useTranslation } from 'react-i18next';
import { Surah, Verse as VerseType } from '@/types';
import { loadSurah } from '@/data/quranData';
import logger from '@/utils/logger';
import { getSurahName } from '@/utils/surahName';

const MIN_FONT_SIZE = 18;
const MAX_FONT_SIZE = 44;
const FONT_SIZE_STEP = 2;
// A verse counts as last read once it has stayed in view this long, so scrolling past doesn't save
const LAST_READ_SAVE_DELAY_MS = 3000;

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
  // First verse in view in the scrolling (non-paginated) layouts
  const [visibleVerseIndex, setVisibleVerseIndex] = useState<number>(route.params.verseIndex ?? 0);
  const { settings, updateSettings } = useSettings();
  const { common } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToLastRead } = useUserData();
  const { audioState, playVerse, stop, setVersesForAutoplay } = useGlobalAudio();
  const flatListRef = useRef<FlatList>(null);
  const initialScrollDone = useRef(false);

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
            // Only update autoplay list if we're not playing another surah
            if (!audioState.currentVerse || audioState.currentVerse.surahNumber === loadedSurah.number) {
              setVersesForAutoplay(loadedSurah.verses);
            }
          }
          setLoading(false);
        } else {
          setSurah(basicSurah);
          // Set verses for autoplay functionality
          if (!audioState.currentVerse || audioState.currentVerse.surahNumber === basicSurah.number) {
            setVersesForAutoplay(basicSurah.verses);
          }
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

  // Update URL when component mounts or verse index changes
  useEffect(() => {
    if (updateVerseUrl && surah) {
      const verseIndex = route.params.verseIndex ?? 0;
      updateVerseUrl(surah, verseIndex);
    }
  }, [basicSurah.number, route.params.verseIndex, updateVerseUrl, surah]);

  // Scroll to bookmark/verse index on load (non-paginated view)
  useEffect(() => {
    const targetIndex = route.params.verseIndex;
    if (targetIndex === undefined || targetIndex === 0 || settings.usePaginatedView || initialScrollDone.current) return;
    if (surah.verses.length === 0) return;
    initialScrollDone.current = true;
    const timer = setTimeout(() => {
      if (Platform.OS === 'web') {
        // Web: all items already in DOM via ScrollView, scrollIntoView works directly
        (typeof document !== 'undefined') &&
          document.getElementById(`verse-item-${targetIndex}`)?.scrollIntoView({ block: 'start' });
      } else {
        flatListRef.current?.scrollToIndex({
          index: Math.min(targetIndex, surah.verses.length - 1),
          animated: false,
          viewPosition: 0,
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [surah.verses.length, route.params.verseIndex, settings.usePaginatedView]);

  // Auto-scroll effect: scroll to the currently playing verse in non-paginated mode
  useEffect(() => {
    if (!settings.audioTrackingEnabled || !audioState.currentVerse || !audioState.isPlaying || settings.usePaginatedView || isUserScrolling) return;

    const timeoutId = setTimeout(() => {
      const playingVerseIndex = surah.verses.findIndex(verse =>
        verse.surahNumber === audioState.currentVerse!.surahNumber &&
        verse.number === audioState.currentVerse!.number
      );
      if (playingVerseIndex === -1) return;

      if (Platform.OS === 'web') {
        (typeof document !== 'undefined') &&
          document.getElementById(`verse-item-${playingVerseIndex}`)?.scrollIntoView({ block: 'center' });
      } else if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: playingVerseIndex, animated: true, viewPosition: 0.5 });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [audioState.currentVerse, audioState.isPlaying, settings.audioTrackingEnabled, settings.usePaginatedView, surah.verses, isUserScrolling]);

  const readingIndex = settings.usePaginatedView ? currentPaginatedIndex : visibleVerseIndex;
  useEffect(() => {
    const verse = surah.verses[readingIndex];
    if (!verse) return;
    const timer = setTimeout(() => {
      const verseText = verse.allTranslations?.[settings.favoriteTranslation] || verse.translation || '';
      addToLastRead(verse.surahNumber, verse.number, getSurahName(t, surah), verseText);
    }, LAST_READ_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [surah, readingIndex, settings.favoriteTranslation, addToLastRead, t]);

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

  const handleVerseChange = useCallback((verseIndex: number) => {
    // Update URL to reflect current verse
    if (updateVerseUrl) {
      updateVerseUrl(surah, verseIndex);
    }

    // Don't auto-play on verse change in paginated view
    // Users can manually tap the play button if they want to hear the verse
    logger.debug('Verse changed to:', verseIndex + 1, 'in surah:', surah.number);
    // Persist current index so PaginatedVerseView remounts won't reset to 0
    setCurrentPaginatedIndex(verseIndex);
  }, [updateVerseUrl, surah]);

  // Handle viewable items change to update URL
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setVisibleVerseIndex(viewableItems[0].index);
    }
    if (viewableItems.length > 0 && updateVerseUrl && !settings.usePaginatedView) {
      const firstVisibleItem = viewableItems[0];
      if (firstVisibleItem && firstVisibleItem.item) {
        const verseIndex = surah.verses.findIndex(
          v => v.surahNumber === firstVisibleItem.item.surahNumber &&
            v.number === firstVisibleItem.item.number
        );
        if (verseIndex !== -1) {
          updateVerseUrl(surah, verseIndex);
        }
      }
    }
  }).current;

  // Web renders every verse in a plain ScrollView (no viewability callbacks), so find the first
  // verse still below the top edge of the scroll area by binary search over the verse elements
  const handleWebScroll = useCallback((event: any) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const container = event.target as HTMLElement | null;
    if (!container?.getBoundingClientRect) return;
    const topEdge = container.getBoundingClientRect().top;
    let low = 0;
    let high = surah.verses.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const el = document.getElementById(`verse-item-${mid}`);
      if (el && el.getBoundingClientRect().bottom > topEdge) high = mid;
      else low = mid + 1;
    }
    setVisibleVerseIndex(low);
  }, [surah.verses.length]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300
  }).current;

  const renderVerse = ({ item, index }: { item: VerseType; index: number }) => (
    <View nativeID={`verse-item-${index}`}>
      <Verse
        verse={item}
        isPlaying={isVerseCurrentlyPlaying(item)}
        onPlayPress={handleVersePress}
        surahVerseCount={surah.verses.length > 0 ? surah.verses.length : surah.verseCount}
        showBookmarkButton={!!user}
        navigation={navigation}
      />
    </View>
  );

  // Memoize styles to prevent re-creation on every render

  const fontSize = settings.surahFontSize;
  const decreaseFontSize = () => updateSettings({ surahFontSize: Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP) });
  const increaseFontSize = () => updateSettings({ surahFontSize: Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP) });

  return (
    <SafeAreaView style={common.container}>
      {loading ? (
        <LoadingView
          text={t('surahDetailScreen.loadingVerses')}
          note={t('surahDetailScreen.loadingNote')}
        />
      ) : (
        <>
          <AppHeader
            title={surah.arabicName}
            subtitle={`${getSurahName(t, surah)} • ${t('surahInfo.verseCount', { count: surah.verseCount })} • ${t(`surahInfo.${surah.revelationPlace}`)}`}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
            showHomeButton={true}
            onHomePress={() => navigation.navigate('Main')}
            fontSizeToggle={
              <FontSizeToggle
                onDecrease={decreaseFontSize}
                onIncrease={increaseFontSize}
                disabledDecrease={fontSize <= MIN_FONT_SIZE}
                disabledIncrease={fontSize >= MAX_FONT_SIZE}
                labels={{
                  decrease: t('surahDetailScreen.decreaseFontSize'),
                  increase: t('surahDetailScreen.increaseFontSize'),
                }}
              />
            }
          />

          {/* Conditional rendering based on settings */}
          {settings.usePaginatedView ? (
            <PaginatedVerseView
              verses={surah.verses}
              initialVerseIndex={currentPaginatedIndex}
              onVerseChange={handleVerseChange}
              navigation={navigation}
            />
          ) : Platform.OS === 'web' ? (
            // Web: ScrollView renders all items immediately — no virtualization,
            // so scrollIntoView works reliably for bookmark navigation
            <ScrollView
              contentContainerStyle={common.pbXl}
              showsVerticalScrollIndicator={false}
              onScroll={handleWebScroll}
              scrollEventThrottle={200}
              onScrollBeginDrag={() => setIsUserScrolling(true)}
              onMomentumScrollEnd={() => setTimeout(() => setIsUserScrolling(false), 1000)}
            >
              {surah.verses.map((item, index) => (
                <View key={`${item.surahNumber}-${item.number}`} nativeID={`verse-item-${index}`}>
                  <Verse
                    verse={item}
                    isPlaying={isVerseCurrentlyPlaying(item)}
                    onPlayPress={handleVersePress}
                    surahVerseCount={surah.verses.length > 0 ? surah.verses.length : surah.verseCount}
                    showBookmarkButton={!!user}
                    navigation={navigation}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={surah.verses}
              renderItem={renderVerse}
              keyExtractor={(item) => `${item.surahNumber}-${item.number}`}
              contentContainerStyle={common.pbXl}
              showsVerticalScrollIndicator={false}
              initialNumToRender={50}
              maxToRenderPerBatch={50}
              windowSize={31}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onScrollBeginDrag={() => setIsUserScrolling(true)}
              onMomentumScrollEnd={() => setTimeout(() => setIsUserScrolling(false), 1000)}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: Math.min(info.index, surah.verses.length - 1),
                    animated: false,
                    viewPosition: 0,
                  });
                }, 100);
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};
