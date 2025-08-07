import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Verse as VerseType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

interface VerseProps {
  verse: VerseType;
  isPlaying: boolean;
  onPlayPress: (verse: VerseType) => void;
}

export const Verse: React.FC<VerseProps> = ({ verse, isPlaying, onPlayPress }) => {
  const { settings } = useSettings();
  const { theme } = useTheme();

  const renderTranslations = () => {
    if (!verse.allTranslations) return null;

    return settings.selectedTranslations.map((translationName, index) => {
      const translationText = verse.allTranslations![translationName];
      if (!translationText) return null;

      return (
        <View key={translationName} style={createStyles(theme).translationContainer}>
          <Text style={createStyles(theme).translationTitle}>{translationName}:</Text>
          <Text style={createStyles(theme).translationText}>{translationText}</Text>
        </View>
      );
    });
  };

  const renderWordTranslations = () => {
    if (!settings.showWordTranslations || !verse.wordTranslations.length) return null;

    return (
      <View style={createStyles(theme).wordTranslationsContainer}>
        <Text style={createStyles(theme).sectionTitle}>Kelime Çevirileri:</Text>
        <View style={createStyles(theme).wordTranslationsGrid}>
          {verse.wordTranslations.map((word, index) => (
            <View key={index} style={createStyles(theme).wordTranslationItem}>
              <Text style={createStyles(theme).wordArabic}>{word.arabic}</Text>
              <Text style={createStyles(theme).wordTranslation}>{word.translation}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={createStyles(theme).container}>
      <View style={createStyles(theme).header}>
        <View style={createStyles(theme).verseNumber}>
          <Text style={createStyles(theme).verseNumberText}>{verse.number}</Text>
        </View>
        <TouchableOpacity
          style={[
            createStyles(theme).playButton,
            isPlaying && createStyles(theme).playButtonActive
          ]}
          onPress={() => onPlayPress(verse)}
        >
          <Text style={[
            createStyles(theme).playButtonText,
            isPlaying && createStyles(theme).playButtonTextActive
          ]}>
            {isPlaying ? '⏹️' : '▶️'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={createStyles(theme).content}>
        <Text style={createStyles(theme).arabicText}>{verse.arabicText}</Text>

        {settings.showTransliteration && verse.transliteration && (
          <Text style={createStyles(theme).transliterationText}>{verse.transliteration}</Text>
        )}

        <View style={createStyles(theme).translationsContainer}>
          {renderTranslations()}
        </View>

        {renderWordTranslations()}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.cardBackground,
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: theme.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  verseNumber: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    color: '#FFFFFF', // Always white for good contrast
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: theme.secondary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: theme.accent,
  },
  playButtonText: {
    fontSize: FONT_SIZES.large,
  },
  playButtonTextActive: {
    color: theme.headerText,
  },
  content: {
    gap: SPACING.md,
  },
  arabicText: {
    fontSize: FONT_SIZES.arabic,
    lineHeight: FONT_SIZES.arabic * 1.5,
    textAlign: 'right',
    color: theme.text,
    fontWeight: '600',
  },
  translationText: {
    fontSize: FONT_SIZES.translation,
    lineHeight: FONT_SIZES.translation * 1.4,
    color: theme.text,
    textAlign: 'left',
  },
  transliterationText: {
    fontSize: FONT_SIZES.medium,
    lineHeight: FONT_SIZES.medium * 1.3,
    color: theme.textSecondary,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  translationsContainer: {
    gap: SPACING.sm,
  },
  translationContainer: {
    paddingVertical: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    paddingLeft: SPACING.sm,
  },
  translationTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  wordTranslationsContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: theme.text,
    marginBottom: SPACING.xs,
  },
  wordTranslationsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    justifyContent: 'flex-end',
  },
  wordTranslationItem: {
    backgroundColor: theme.surface,
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
    borderRadius: 6,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  wordArabic: {
    fontSize: FONT_SIZES.small,
    color: theme.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  wordTranslation: {
    fontSize: FONT_SIZES.small - 2,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
