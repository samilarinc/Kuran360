import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Verse as VerseType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

interface VerseProps {
  verse: VerseType;
  isPlaying: boolean;
  onPlayPress: (verse: VerseType) => void;
}

export const Verse: React.FC<VerseProps> = ({ verse, isPlaying, onPlayPress }) => {
  const { settings } = useSettings();

  const renderTranslations = () => {
    if (!verse.allTranslations) return null;

    return settings.selectedTranslations.map((translationName, index) => {
      const translationText = verse.allTranslations![translationName];
      if (!translationText) return null;

      return (
        <View key={translationName} style={styles.translationContainer}>
          <Text style={styles.translationTitle}>{translationName}:</Text>
          <Text style={styles.translationText}>{translationText}</Text>
        </View>
      );
    });
  };

  const renderWordTranslations = () => {
    if (!settings.showWordTranslations || !verse.wordTranslations.length) return null;

    return (
      <View style={styles.wordTranslationsContainer}>
        <Text style={styles.sectionTitle}>Kelime Çevirileri:</Text>
        <View style={styles.wordTranslationsGrid}>
          {verse.wordTranslations.map((word, index) => (
            <View key={index} style={styles.wordTranslationItem}>
              <Text style={styles.wordArabic}>{word.arabic}</Text>
              <Text style={styles.wordTranslation}>{word.translation}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.verseNumber}>
          <Text style={styles.verseNumberText}>{verse.number}</Text>
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

        {settings.showTransliteration && verse.transliteration && (
          <Text style={styles.transliterationText}>{verse.transliteration}</Text>
        )}

        <View style={styles.translationsContainer}>
          {renderTranslations()}
        </View>

        {renderWordTranslations()}
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
  transliterationText: {
    fontSize: FONT_SIZES.medium,
    lineHeight: FONT_SIZES.medium * 1.3,
    color: COLORS.textSecondary,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  translationsContainer: {
    gap: SPACING.sm,
  },
  translationContainer: {
    paddingVertical: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
  },
  translationTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  wordTranslationsContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  wordTranslationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  wordTranslationItem: {
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
    borderRadius: 6,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  wordArabic: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  wordTranslation: {
    fontSize: FONT_SIZES.small - 2,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
