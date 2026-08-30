import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FontSizeToggle } from '@msarinc/ui';
import { Verse } from '@/components/Verse';
import { PaginatedVerseView } from '@/components/PaginatedVerseView';
import { AppHeader } from '@/components/AppHeader';
import { AutoplayToggle } from '@/components/AutoplayToggle';
import { AudioTrackingToggle } from '@/components/AudioTrackingToggle';
import { LoadingView } from '@/components/LoadingView';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useDebouncedSettings } from '@/hooks/useDebouncedSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useTranslation } from 'react-i18next';
import { Surah, Verse as VerseType, LastRead } from '@/types';
import { loadSurah } from '@/data/quranData';
import logger from '@/utils/logger';
import { getSurahName } from '@/utils/surahName';
import { createStyles } from './SurahDetailScreen.styles';
import { createCommonStyles } from '@/theme/common.styles';

const MIN_FONT_SIZE = 18;
const MAX_FONT_SIZE = 44;
const FONT_SIZE_STEP = 2;

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToLastRead, lastRead } = useUserData();
  const { audioState, playVerse, stop, pause, resume, togglePlayPause, setVersesForAutoplay, changePlaybackRate } = useGlobalAudio();
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
  }, [surah.verses.length]);

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

  // Track last read verses for logged in users with 10-second interval checking
  const currentKey = useMemo(() => {
    if (!surah || surah.verses.length === 0) return null;
    if (settings.usePaginatedView) {
      return `${surah.number}-${currentPaginatedIndex}`;
    }
    const cv = audioState.currentVerse;
    return cv ? `${cv.surahNumber}-${cv.number}` : `${surah.number}-1`;
  }, [settings.usePaginatedView, currentPaginatedIndex, audioState.currentVerse, surah?.number, surah?.verses?.length]);

  useEffect(() => {
    if (!user?.uid || !surah || surah.verses.length === 0) return;

    // Set up 10-second interval to check current verse
    const intervalId = setInterval(() => {
      const currentVerse = settings.usePaginatedView
        ? surah.verses[currentPaginatedIndex]
        : (audioState.currentVerse || surah.verses[0]);

      if (!currentVerse) return;

      const surahName = getSurahName(t, surah);
      const verseText = currentVerse.allTranslations?.[settings.favoriteTranslation] || currentVerse.translation || '';
      if (!verseText.trim()) return;

      // Check if this verse is already in lastRead
      const isAlreadyInLastRead = lastRead.some((lr: LastRead) =>
        lr.surahNumber === currentVerse.surahNumber && lr.verseNumber === currentVerse.number
      );

      // Only add if not already in the list
      if (!isAlreadyInLastRead) {
        addToLastRead(
          currentVerse.surahNumber,
          currentVerse.number,
          surahName,
          verseText
        );
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [user?.uid, surah, currentPaginatedIndex, audioState.currentVerse, settings.usePaginatedView, settings.favoriteTranslation, lastRead, addToLastRead]);

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
    // Update URL to reflect current verse
    if (updateVerseUrl) {
      updateVerseUrl(surah, verseIndex);
    }

    // Don't auto-play on verse change in paginated view
    // Users can manually tap the play button if they want to hear the verse
    logger.debug('Verse changed to:', verseIndex + 1, 'in surah:', surah.number);
    // Persist current index so PaginatedVerseView remounts won't reset to 0
    setCurrentPaginatedIndex(verseIndex);
  };

  // Handle viewable items change to update URL
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
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

  // Memoize toggle handlers to prevent unnecessary re-renders
  const handleAutoplayToggle = useCallback((enabled: boolean) => {
    updateSettings({ autoplayEnabled: enabled });
  }, [updateSettings]);

  // Memoize styles to prevent re-creation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);
  const common = useMemo(() => createCommonStyles(theme), [theme]);

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
            subtitle={`${getSurahName(t, surah)} • ${surah.verseCount} ayet • ${surah.revelationPlace}`}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
            showHomeButton={true}
            onHomePress={() => navigation.navigate('Main')}
            autoplayToggle={
              <AutoplayToggle
                isEnabled={settings.autoplayEnabled}
                onToggle={handleAutoplayToggle}
              />
            }
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
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
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
              contentContainerStyle={styles.listContainer}
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
