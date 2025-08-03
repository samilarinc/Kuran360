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
import { Verse } from '../components/Verse';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Surah, Verse as VerseType } from '../types';
import { loadSurah } from '../data/quranData';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

interface SurahDetailScreenProps {
  route: {
    params: {
      surah: Surah;
    };
  };
  navigation: any;
}

export const SurahDetailScreen: React.FC<SurahDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { surah: basicSurah } = route.params;
  const [surah, setSurah] = useState<Surah>(basicSurah);
  const [loading, setLoading] = useState(true);
  const { audioState, playVerse, stop } = useAudioPlayer();

  useEffect(() => {
    const loadSurahData = async () => {
      try {
        setLoading(true);
        
        // Load the full surah with verses if not already loaded
        if (basicSurah.verses.length === 0) {
          const loadedSurah = loadSurah(basicSurah.number);
          if (loadedSurah) {
            setSurah(loadedSurah);
          }
        } else {
          setSurah(basicSurah);
        }
      } catch (error) {
        console.error('Error loading surah verses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSurahData();
  }, [basicSurah]);

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
            <Text style={styles.surahName}>{surah.arabicName}</Text>
            <Text style={styles.surahInfo}>
              {surah.name} • {surah.verseCount} verses • {surah.revelationPlace}
            </Text>
          </View>

          <FlatList
            data={surah.verses}
            renderItem={renderVerse}
            keyExtractor={(item) => `${item.surahNumber}-${item.number}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />

          {audioState.currentVerse && (
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: SPACING.lg,
    zIndex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
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
