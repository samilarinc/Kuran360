import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Verse as VerseType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import logger from '../utils/logger';
import { FONT_SIZES, SPACING } from '../constants';
import { useGlobalAudio } from '../contexts/AudioContext';

interface VerseProps {
  verse: VerseType;
  isPlaying: boolean;
  onPlayPress: (verse: VerseType) => void;
  surahVerseCount?: number; // clamp end to this count
}

export const Verse: React.FC<VerseProps> = ({ verse, isPlaying, onPlayPress, surahVerseCount }) => {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { startMemorization, cancelMemorization } = useGlobalAudio();
  const [memOpen, setMemOpen] = useState(false);
  const maxEnd = useMemo(() => {
    // Cap strictly to provided surah count; if missing, default to current verse (no growth)
    logger.debug('Surah verse count:', surahVerseCount, verse.number);
    return surahVerseCount && surahVerseCount > 0 ? surahVerseCount : verse.number;
  }, [surahVerseCount, verse.number]);
  const [endVerse, setEndVerse] = useState<number>(Math.min(verse.number, maxEnd));

  // Keep endVerse within [currentVerseNumber, maxEnd] when surah count changes
  useEffect(() => {
    setEndVerse(v => clamp(v, verse.number, maxEnd));
  }, [maxEnd, verse.number]);
  const [repeats, setRepeats] = useState<number>(3);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const canStartMem = useMemo(() => endVerse >= verse.number, [endVerse, verse.number]);

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

        {/* Memorization inline control */}
        <View style={createStyles(theme).memContainer}>
          {!memOpen ? (
            <TouchableOpacity style={createStyles(theme).memToggle} onPress={() => setMemOpen(true)}>
              <Text style={createStyles(theme).memToggleText}>🧠 Ezberle</Text>
            </TouchableOpacity>
          ) : (
            <View style={createStyles(theme).memPanel}>
              <View style={createStyles(theme).memRow}>
                <Text style={createStyles(theme).memLabel}>Şuraya Kadar</Text>
                <View style={createStyles(theme).memStepper}>
                  <TouchableOpacity
                    style={createStyles(theme).stepBtn}
                    onPress={() => setEndVerse(v => clamp(v - 1, verse.number, maxEnd))}
                  >
                    <Text style={createStyles(theme).stepText}>-</Text>
                  </TouchableOpacity>
                  <Text style={createStyles(theme).memValue}>{endVerse}</Text>
                  <TouchableOpacity
                    style={createStyles(theme).stepBtn}
                    onPress={() => setEndVerse(v => clamp(v + 1, verse.number, maxEnd))}
                  >
                    <Text style={createStyles(theme).stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={createStyles(theme).memRow}>
                <Text style={createStyles(theme).memLabel}>Tekrar Sayısı</Text>
                <View style={createStyles(theme).memStepper}>
                  <TouchableOpacity
                    style={createStyles(theme).stepBtn}
                    onPress={() => setRepeats(r => clamp(r - 1, 1, 99))}
                  >
                    <Text style={createStyles(theme).stepText}>-</Text>
                  </TouchableOpacity>
                  <Text style={createStyles(theme).memValue}>{repeats}</Text>
                  <TouchableOpacity
                    style={createStyles(theme).stepBtn}
                    onPress={() => setRepeats(r => clamp(r + 1, 1, 99))}
                  >
                    <Text style={createStyles(theme).stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={createStyles(theme).memActions}>
                <TouchableOpacity
                  style={[createStyles(theme).memStartBtn, !canStartMem && createStyles(theme).memStartBtnDisabled]}
                  disabled={!canStartMem}
                  onPress={() => startMemorization(verse.surahNumber, verse.number, endVerse, repeats)}
                >
                  <Text style={createStyles(theme).memStartText}>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity style={createStyles(theme).memCancelBtn} onPress={() => { cancelMemorization(); setMemOpen(false); }}>
                  <Text style={createStyles(theme).memCancelText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
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
    // Ensure correct Arabic shaping & direction on web (especially Chrome/Linux)
    writingDirection: 'rtl',
    // Use high-quality Arabic fonts on web; fall back to system if unavailable
    fontFamily: Platform.select({
      web: '"Scheherazade New", "Noto Naskh Arabic", Amiri, serif',
      default: undefined as any,
    }),
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
    writingDirection: 'rtl',
    fontFamily: Platform.select({
      web: '"Scheherazade New", "Noto Naskh Arabic", Amiri, serif',
      default: undefined as any,
    }),
  },
  wordTranslation: {
    fontSize: FONT_SIZES.small - 2,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  memContainer: {
    marginTop: SPACING.sm,
  },
  memToggle: {
    alignSelf: 'flex-end',
    backgroundColor: theme.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memToggleText: {
    color: theme.headerText,
    fontWeight: '600',
  },
  memPanel: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  memRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memLabel: {
    color: theme.text,
    fontWeight: '600',
  },
  memStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: theme.text,
    fontSize: FONT_SIZES.large,
  },
  memValue: {
    minWidth: 28,
    textAlign: 'center',
    color: theme.text,
    fontWeight: '600',
  },
  memActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  memHint: {
    color: theme.textSecondary,
    fontSize: FONT_SIZES.small,
    textAlign: 'right',
  },
  memStartBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  memStartBtnDisabled: {
    opacity: 0.5,
  },
  memStartText: {
    color: '#fff',
    fontWeight: '700',
  },
  memCancelBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  memCancelText: {
    color: theme.headerText,
    fontWeight: '700',
  },
});
