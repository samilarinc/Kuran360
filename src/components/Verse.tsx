import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Verse as VerseType, VerseShareData } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import logger from '../utils/logger';
import { FONT_SIZES, SPACING } from '../constants';
import { useGlobalAudio } from '../contexts/AudioContext';
import { ShareModal } from './ShareModal';
import { ShareService } from '../utils/shareUtils';
import { getSurahsList } from '../data/quranData';

interface VerseProps {
  verse: VerseType;
  isPlaying: boolean;
  onPlayPress: (verse: VerseType) => void;
  surahVerseCount?: number; // clamp end to this count
  showBookmarkButton?: boolean;
  showMemorization?: boolean;
  navigation?: any; // Navigation prop for going to all translations screen
}

export const Verse: React.FC<VerseProps> = ({ verse, isPlaying, onPlayPress, surahVerseCount, showBookmarkButton = false, showMemorization = true, navigation }) => {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { addBookmark, removeBookmark, isBookmarked, bookmarks } = useUserData();
  const { startMemorization, cancelMemorization } = useGlobalAudio();
  const [memOpen, setMemOpen] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
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
  const [memMode, setMemMode] = useState<'range' | 'individual'>('range');

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const canStartMem = useMemo(() => endVerse >= verse.number, [endVerse, verse.number]);

  const renderTranslations = () => {
    if (!verse.allTranslations) return null;

    // Favori meal'i ilk sıraya getir, sonra diğerleri
    const orderedTranslations = [...settings.selectedTranslations].sort((a, b) => {
      if (a === settings.favoriteTranslation) return -1;
      if (b === settings.favoriteTranslation) return 1;
      return 0;
    });

    return orderedTranslations.map((translationName, index) => {
      const translationText = verse.allTranslations![translationName];
      if (!translationText) return null;

      const isFavorite = translationName === settings.favoriteTranslation;

      return (
        <View key={translationName} style={[
          createStyles(theme).translationContainer,
          isFavorite && createStyles(theme).favoriteTranslationContainer
        ]}>
          <Text style={[
            createStyles(theme).translationTitle,
            isFavorite && createStyles(theme).favoriteTranslationTitle
          ]}>
            {isFavorite && '⭐ '}{translationName}:
          </Text>
          <Text style={[
            createStyles(theme).translationText,
            isFavorite && createStyles(theme).favoriteTranslationTextStyle
          ]}>
            {translationText}
          </Text>
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

  // Web'de meta etiketlerini güncelle
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        ShareService.updateWebMetaForVerse({
          arabicText: verse.arabicText,
          translation: verse.allTranslations?.[settings.favoriteTranslation] || verse.translation || '',
          surahName: getSurahsList()[verse.surahNumber - 1]?.name || 'Sure',
          surahNumber: verse.surahNumber,
          verseNumber: verse.number,
        } as any);
      } catch (e) {
        // Sessiz geç
      }
    }
  }, [verse.surahNumber, verse.number, verse.arabicText, settings.favoriteTranslation]);

  // Inline hover translations in the main Arabic line (web only)
  const InlineArabicWithHover: React.FC = () => {
    if (Platform.OS !== 'web' || !settings.inlineWordTranslations || verse.wordTranslations.length === 0) {
      return <Text style={createStyles(theme).arabicText}>{verse.arabicText}</Text>;
    }

    // Build lookup map
    const map = new Map<string, string>();
    verse.wordTranslations.forEach(w => {
      if (w.arabic) map.set(w.arabic, w.translation);
    });

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Try to reconstruct spaced text from word translations, fallback to original
    let displayText = verse.arabicText;
    let words = verse.wordTranslations.map(w => w.arabic).filter(Boolean);

    // If we have word translations, try to create a spaced version
    if (words.length > 0) {
      displayText = words.join(' ');
    }

    const tokens = displayText.split(/\s+/).filter(Boolean);

    return (
      <View style={createStyles(theme).inlineArabicRow}>
        {tokens.map((tok, idx) => {
          const tr = map.get(tok);
          const isHover = hoveredIndex === idx && !!tr;
          return (
            <View key={idx} style={createStyles(theme).inlineArabicWordWrap}>
              <Text
                style={[
                  createStyles(theme).arabicText,
                  createStyles(theme).inlineArabicWord,
                  isHover && createStyles(theme).inlineArabicWordHover,
                ]}
                // @ts-ignore web-only hover handlers
                onMouseEnter={() => setHoveredIndex(idx)}
                // @ts-ignore
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {tok}
              </Text>
              {isHover && (
                <View style={createStyles(theme).hoverCard}>
                  <Text style={createStyles(theme).hoverCardText}>{tr}</Text>
                </View>
              )}
              {/* Space between words, preserved visually on web */}
              {idx < tokens.length - 1 && <Text style={createStyles(theme).inlineSpace}> </Text>}
            </View>
          );
        })}
      </View>
    );
  };

  const handleBookmarkToggle = async () => {
    if (!user || !showBookmarkButton) return;

    const surahName = verse.surahNumber === 1 ? "Al-Fatiha" : `Surah ${verse.surahNumber}`;
    const verseText = verse.allTranslations?.[settings.favoriteTranslation] || verse.translation || '';

    // Don't proceed if we don't have verse text
    if (!verseText.trim()) {
      console.warn('Cannot bookmark verse without text');
      return;
    }

    if (isBookmarked(verse.surahNumber, verse.number)) {
      // Find the bookmark to remove by its ID
      const bookmark = bookmarks.find(b => b.surahNumber === verse.surahNumber && b.verseNumber === verse.number);
      if (bookmark) {
        await removeBookmark(bookmark.id);
      }
    } else {
      await addBookmark(verse.surahNumber, verse.number, surahName, verseText);
    }
  };

  // Sure adını almak için yardımcı fonksiyon
  const getSurahName = () => {
    const surahs = getSurahsList();
    const surah = surahs.find(s => s.number === verse.surahNumber);
    return surah?.turkishName || surah?.name || `${verse.surahNumber}. Sure`;
  };

  // Share data için gerekli bilgileri hazırla
  const shareData: VerseShareData = useMemo(() => {
    const surahName = getSurahName();
    const translation = verse.allTranslations?.[settings.favoriteTranslation] || verse.translation || '';

    return {
      arabicText: verse.arabicText,
      translation: translation,
      surahName: surahName,
      verseNumber: verse.number,
      surahNumber: verse.surahNumber,
    };
  }, [verse, settings.favoriteTranslation]);

  return (
    <View style={createStyles(theme).container}>
      <View style={createStyles(theme).header}>
        <View style={createStyles(theme).verseNumber}>
          <Text style={createStyles(theme).verseNumberText}>{verse.number}</Text>
        </View>
        <View style={createStyles(theme).headerActions}>
          {showBookmarkButton && user && (
            <TouchableOpacity
              style={createStyles(theme).bookmarkButton}
              onPress={handleBookmarkToggle}
            >
              <Text style={createStyles(theme).bookmarkIcon}>
                {isBookmarked(verse.surahNumber, verse.number) ? '🔖' : '📌'}
              </Text>
            </TouchableOpacity>
          )}
          {navigation && (
            <TouchableOpacity
              style={createStyles(theme).allTranslationsButton}
              onPress={() => navigation.navigate('AllTranslations', { verse })}
            >
              <Text style={createStyles(theme).allTranslationsIcon}>📚</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={createStyles(theme).shareButton}
            onPress={() => setShareModalVisible(true)}
          >
            <Text style={createStyles(theme).shareIcon}>📤</Text>
          </TouchableOpacity>
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
      </View>

      <View style={createStyles(theme).content}>
        <InlineArabicWithHover />

        {settings.showTransliteration && verse.transliteration && (
          <Text style={createStyles(theme).transliterationText}>{verse.transliteration}</Text>
        )}

        <View style={createStyles(theme).translationsContainer}>
          {renderTranslations()}
        </View>

        {renderWordTranslations()}

        {/* Memorization inline control */}
        {showMemorization && (
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
                  <Text style={createStyles(theme).memLabel}>
                    {memMode === 'individual' ? 'Her Ayet İçin' : 'Tekrar Sayısı'}
                  </Text>
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
                <View style={createStyles(theme).memRow}>
                  <Text style={createStyles(theme).memLabel}>Ezber Modu</Text>
                  <View style={createStyles(theme).memToggleContainer}>
                    <TouchableOpacity
                      style={[
                        createStyles(theme).memModeBtn,
                        createStyles(theme).memModeBtnLeft,
                        memMode === 'range' && createStyles(theme).memModeBtnActive
                      ]}
                      onPress={() => setMemMode('range')}
                    >
                      <Text style={[
                        createStyles(theme).memModeText,
                        memMode === 'range' && createStyles(theme).memModeTextActive
                      ]}>Aralık</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        createStyles(theme).memModeBtn,
                        createStyles(theme).memModeBtnRight,
                        memMode === 'individual' && createStyles(theme).memModeBtnActive
                      ]}
                      onPress={() => setMemMode('individual')}
                    >
                      <Text style={[
                        createStyles(theme).memModeText,
                        memMode === 'individual' && createStyles(theme).memModeTextActive
                      ]}>Ayet Ayet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={createStyles(theme).memActions}>
                  <TouchableOpacity
                    style={[createStyles(theme).memStartBtn, !canStartMem && createStyles(theme).memStartBtnDisabled]}
                    disabled={!canStartMem}
                    onPress={() => startMemorization(verse.surahNumber, verse.number, endVerse, repeats, memMode)}
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
        )}
      </View>

      {/* Share Modal */}
      <ShareModal
        isVisible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        verseData={shareData}
      />
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
  inlineArabicRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  inlineArabicWordWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineArabicWord: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    // keep same font and direction as arabicText; Text merges styles
    cursor: 'pointer',
  },
  inlineArabicWordHover: {
    color: theme.secondary,
  },
  hoverCard: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 8,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: theme.primary,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 200,
    minWidth: 80,
  },
  hoverCardText: {
    color: theme.text,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: FONT_SIZES.medium * 1.2,
  },
  inlineSpace: {
    // Visual spacing between tokens; width is controlled by content (space char)
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
  favoriteTranslationContainer: {
    backgroundColor: '#FFD700' + '10', // Altın sarısı tint
    borderLeftColor: '#FFD700',
    borderLeftWidth: 4,
    borderRadius: 6,
    marginVertical: 2,
  },
  translationTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  favoriteTranslationTitle: {
    color: '#B8860B', // Koyu altın
    fontWeight: '700',
  },
  favoriteTranslationTextStyle: {
    fontWeight: '500',
    color: theme.text,
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
  memToggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  memModeBtn: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 0,
  },
  memModeBtnLeft: {
    borderRightWidth: 0.5,
    borderRightColor: theme.border,
  },
  memModeBtnRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: theme.border,
  },
  memModeBtnActive: {
    backgroundColor: theme.primary,
  },
  memModeText: {
    fontSize: FONT_SIZES.small,
    color: theme.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  memModeTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bookmarkButton: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  bookmarkIcon: {
    fontSize: 18,
  },
  shareButton: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.secondary,
  },
  shareIcon: {
    fontSize: 16,
  },
  allTranslationsButton: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  allTranslationsIcon: {
    fontSize: 16,
  },
});
