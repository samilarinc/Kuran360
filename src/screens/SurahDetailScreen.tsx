import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Verse } from '../components/Verse';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Surah, Verse as VerseType } from '../types';
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
  const { surah } = route.params;
  const { audioState, playVerse, stop } = useAudioPlayer();

  const handleVersePress = (verse: VerseType) => {
    const isCurrentVersePlaying = audioState.currentVerse?.surahNumber === verse.surahNumber &&
      audioState.currentVerse?.verseNumber === verse.verseNumber &&
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
      audioState.currentVerse?.verseNumber === verse.verseNumber &&
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.surahName}>{surah.arabicName}</Text>
        <Text style={styles.surahInfo}>
          {surah.name} • {surah.numberOfVerses} verses • {surah.isMeccan ? 'Meccan' : 'Medinan'}
        </Text>
      </View>

      <FlatList
        data={surah.verses}
        renderItem={renderVerse}
        keyExtractor={(item) => `${item.surahNumber}-${item.verseNumber}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {audioState.currentVerse && (
        <View style={styles.audioInfo}>
          <Text style={styles.audioInfoText}>
            {audioState.isLoading
              ? 'Loading...'
              : `${audioState.isPlaying ? 'Playing' : 'Paused'}: Verse ${audioState.currentVerse.verseNumber}`
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
