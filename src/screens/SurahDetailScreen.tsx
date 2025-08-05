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
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSettings } from '../contexts/SettingsContext';
import { Surah, Verse as VerseType } from '../types';
import { loadSurah } from '../data/quranData';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

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
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <View style={styles.surahInfoContainer}>
              <Text style={styles.surahName}>{surah.arabicName}</Text>
              <Text style={styles.surahInfo}>
                {surah.name} • {surah.verseCount} verses • {surah.revelationPlace}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.autoplayToggle,
                settings.autoplayEnabled && styles.autoplayToggleActive
              ]}
              onPress={() => updateSettings({ autoplayEnabled: !settings.autoplayEnabled })}
            >
              <Text style={[
                styles.autoplayToggleText,
                settings.autoplayEnabled && styles.autoplayToggleTextActive
              ]}>
                {settings.autoplayEnabled ? '🔊' : '🔇'}
              </Text>
            </TouchableOpacity>
          </View>

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
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}

          {audioState.currentVerse && !settings.usePaginatedView && (
            <View style={styles.audioInfo}>
              <Text style={styles.audioInfoText}>
                {audioState.isLoading
                  ? 'Loading...'
                  : `${audioState.isPlaying ? 'Playing' : 'Paused'}: Verse ${audioState.currentVerse.number}`
                }
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  backButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  surahInfoContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  surahName: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  surahInfo: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  autoplayToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.textSecondary + '30',
  },
  autoplayToggleActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  autoplayToggleText: {
    fontSize: 20,
  },
  autoplayToggleTextActive: {
    // No additional styling needed for active text
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
  audioInfo: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  audioInfoText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
  },
});
