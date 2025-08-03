import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Verse as VerseType } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

interface VerseProps {
  verse: VerseType;
  isPlaying: boolean;
  onPlayPress: (verse: VerseType) => void;
}

export const Verse: React.FC<VerseProps> = ({ verse, isPlaying, onPlayPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.verseNumber}>
          <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.playButton,
            isPlaying && styles.playButtonActive
          ]}
          onPress={() => onPlayPress(verse)}
        >
          <Text style={[
            styles.playButtonText,
            isPlaying && styles.playButtonTextActive
          ]}>
            {isPlaying ? '⏹️' : '▶️'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.arabicText}>{verse.arabicText}</Text>
        <Text style={styles.translationText}>{verse.turkishTranslation}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  verseNumber: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: COLORS.accent,
  },
  playButtonText: {
    fontSize: FONT_SIZES.large,
  },
  playButtonTextActive: {
    color: COLORS.surface,
  },
  content: {
    gap: SPACING.md,
  },
  arabicText: {
    fontSize: FONT_SIZES.arabic,
    lineHeight: FONT_SIZES.arabic * 1.5,
    textAlign: 'right',
    color: COLORS.text,
    fontWeight: '600',
  },
  translationText: {
    fontSize: FONT_SIZES.translation,
    lineHeight: FONT_SIZES.translation * 1.4,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
});
