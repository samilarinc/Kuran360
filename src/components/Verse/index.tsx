import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Bookmark, Library, Share2, Play, Square, BrainCircuit } from 'lucide-react-native';
import { Verse as VerseType, VerseShareData, WordTranslation } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { getFontOption, getArabicFontFamily } from '@/constants/fonts';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useActiveWord } from '@/hooks/useActiveWordIndex';
import { RecitedBackdrop, SpokenWordMarker, useHiddenWordStyle } from '../SpokenWordMarker';
import { ShareModal } from '../ShareModal';
import { ArabicText } from '../ArabicText';
import { WordRootModal } from '../WordRootModal';
import { ShareService } from '@/utils/shareUtils';
import { getSurahsList } from '@/data/quranData';
import { useTranslation } from 'react-i18next';
import { getSurahNameByNumber } from '@/utils/surahName';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { formatVerseNumber } from '@/utils/numerals';
import { formatRoot, getSpacedArabicText, getWordSegments } from '@/utils/arabicText';
import { createStyles } from './index.styles';
import type { CommonStyles } from '@/theme/common.styles';

const BOOKMARK_COLOR = '#F43F5E';
const ALL_TRANSLATIONS_COLOR = '#6366F1';
const SHARE_COLOR = '#F97316';
const PLAY_COLOR = '#10B981';

// Inline hover translations in the main Arabic line (web only)
const InlineArabicWithHover: React.FC<{
  verse: VerseType;
  inlineWordTranslations: boolean;
  surahFontSize: number;
  arabicFontFamily: string;
  common: CommonStyles;
  styles: ReturnType<typeof createStyles>;
  onWordPress: (word: WordTranslation) => void;
}> = ({ verse, inlineWordTranslations, surahFontSize, arabicFontFamily, common, styles, onWordPress }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Width of the space between words, measured once; the recited-word bands extend half of it on each side
  const [spaceWidth, setSpaceWidth] = useState(0);
  // Word being recited (null when the verse isn't playing or the reciter has no word timings)
  const activeWord = useActiveWord(verse);
  const { settings } = useSettings();
  const showRoots = settings.showWordRoots;
  const hiddenWordStyle = useHiddenWordStyle();
  // Hover translations (web) need the word-by-word layout. It is also used when they are off, so the line
  // spacing is the same whether or not the verse plays (the recited word's marker needs the room under it).
  // In that case it mimics a plain paragraph: no word padding and a real Arabic space.
  const hasHoverWords = Platform.OS === 'web' && inlineWordTranslations && verse.wordTranslations.length > 0;
  const arabicLineStyle = { fontFamily: arabicFontFamily, fontSize: surahFontSize, lineHeight: surahFontSize * 1.5 };
  const wordStyle = [common.arabicText, arabicLineStyle, hasHoverWords && styles.inlineArabicWord];

  // Source text has no spaces; each segment is one listed word plus any particle folded into its translation
  const segments = getWordSegments(verse);

  return (
    <View style={styles.inlineArabicRow}>
      {segments.map((segment, idx) => {
        const tr = segment.translation;
        const isHover = hasHoverWords && hoveredIndex === idx && !!tr;
        return (
          <View
            key={idx}
            style={styles.inlineArabicWordWrap}
            // @ts-ignore web-only hover handlers: on the wrapper, so the pointer can move from the word onto its card
            onMouseEnter={() => setHoveredIndex(idx)}
            // @ts-ignore
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <View style={styles.spokenWordBox}>
              {activeWord && idx < activeWord.index && <RecitedBackdrop padX={spaceWidth / 2} />}
              <Text
                style={[wordStyle, isHover && styles.inlineArabicWordHover, activeWord && idx < activeWord.index && styles.recitedWord, activeWord?.index === idx && hiddenWordStyle]}
                onPress={hasHoverWords && showRoots && segment.root ? () => onWordPress(segment) : undefined}
              >
                {segment.arabic}
              </Text>
              {activeWord?.index === idx && (
                <SpokenWordMarker
                  word={segment.arabic}
                  textStyle={wordStyle}
                  elapsedMs={activeWord.elapsedMs}
                  durationMs={activeWord.durationMs}
                  isPlaying={activeWord.isPlaying}
                  playbackRate={settings.playbackRate}
                  padX={spaceWidth / 2}
                />
              )}
              {isHover && (
                <View style={styles.hoverCardWrap} pointerEvents="box-none">
                  <View style={styles.hoverCardBridge}>
                    <View style={styles.hoverCard}>
                      <Text style={styles.hoverCardText}>{tr}</Text>
                      {showRoots && !!segment.root && (
                        <TouchableOpacity style={styles.hoverCardRootChip} onPress={() => onWordPress(segment)}>
                          <ArabicText style={styles.hoverCardRoot}>{formatRoot(segment.root)}</ArabicText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
            {/* Space between words, preserved visually on web */}
            {idx < segments.length - 1 && (
              <Text
                style={!hasHoverWords && arabicLineStyle}
                onLayout={idx === 0 ? (e: LayoutChangeEvent) => setSpaceWidth(e.nativeEvent.layout.width) : undefined}
              > </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

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
  const { theme, common } = useTheme();
  const { t } = useTranslation();
  const { goToRoot } = useNavigationHelpers();
  const arabicFontOption = getFontOption(settings.arabicFont);
  const styles = useThemedStyles(createStyles);
  // Matches common.arabicText's fontWeight: '600' below
  const arabicFontFamily = getArabicFontFamily(arabicFontOption, true);
  const { user } = useAuth();
  const { addBookmark, removeBookmark, isBookmarked, bookmarks } = useUserData();
  const { startMemorization, cancelMemorization } = useGlobalAudio();
  const [memOpen, setMemOpen] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordTranslation | null>(null);
  const maxEnd = useMemo(() => {
    // Cap strictly to provided surah count; if missing, default to current verse (no growth)
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

    return orderedTranslations.map((translationName) => {
      const translationText = verse.allTranslations![translationName];
      if (!translationText) return null;

      const isFavorite = translationName === settings.favoriteTranslation;

      return (
        <View key={translationName} style={[
          styles.translationContainer,
          isFavorite && styles.favoriteTranslationContainer
        ]}>
          <Text style={[
            styles.translationTitle,
            isFavorite && styles.favoriteTranslationTitle
          ]}>
            {isFavorite && '⭐ '}{translationName}:
          </Text>
          <Text style={[
            styles.translationText,
            isFavorite && styles.favoriteTranslationTextStyle
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
      <View style={styles.wordTranslationsContainer}>
        <Text style={styles.sectionTitle}>{t('verse.wordTranslations')}</Text>
        <View style={styles.wordTranslationsGrid}>
          {getWordSegments(verse).map((word, index) => (
            <TouchableOpacity
              key={index}
              style={[common.wordItem, settings.showWordRoots && !!word.root && common.wordItemWithRoot]}
              disabled={!settings.showWordRoots || !word.root}
              onPress={() => setSelectedWord(word)}
            >
              <ArabicText style={common.wordArabic}>{word.arabic}</ArabicText>
              <Text style={common.wordTranslation}>{word.translation}</Text>
            </TouchableOpacity>
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
          surahName: getSurahsList()[verse.surahNumber - 1]?.name || t('verse.surahFallback'),
          surahNumber: verse.surahNumber,
          verseNumber: verse.number,
        } as any);
      } catch (e) {
        // Sessiz geç
      }
    }
  }, [verse.surahNumber, verse.number, verse.arabicText, verse.allTranslations, verse.translation, settings.favoriteTranslation, t]);

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

  // Share data için gerekli bilgileri hazırla
  const shareData: VerseShareData = useMemo(() => {
    const surahName = getSurahNameByNumber(t, verse.surahNumber);
    const translation = verse.allTranslations?.[settings.favoriteTranslation] || verse.translation || '';

    return {
      arabicText: getSpacedArabicText(verse),
      translation: translation,
      surahName: surahName,
      verseNumber: verse.number,
      surahNumber: verse.surahNumber,
    };
  }, [verse, settings.favoriteTranslation, t]);

  return (
    <View style={styles.container}>
      <View style={[common.rowBetween, common.mbMd]}>
        <View style={styles.verseNumber}>
          <Text style={styles.verseNumberText}>{formatVerseNumber(verse.number, settings.verseNumberStyle)}</Text>
        </View>
        <View style={common.rowGap}>
          {showBookmarkButton && user && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: BOOKMARK_COLOR + '1A', borderColor: BOOKMARK_COLOR }]}
              onPress={handleBookmarkToggle}
            >
              <Bookmark
                size={18}
                color={BOOKMARK_COLOR}
                fill={isBookmarked(verse.surahNumber, verse.number) ? BOOKMARK_COLOR : 'transparent'}
              />
            </TouchableOpacity>
          )}
          {navigation && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: ALL_TRANSLATIONS_COLOR + '1A', borderColor: ALL_TRANSLATIONS_COLOR }]}
              onPress={() => navigation.navigate('AllTranslations', { verse })}
            >
              <Library size={18} color={ALL_TRANSLATIONS_COLOR} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: SHARE_COLOR + '1A', borderColor: SHARE_COLOR }]}
            onPress={() => setShareModalVisible(true)}
          >
            <Share2 size={16} color={SHARE_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: PLAY_COLOR },
              isPlaying && styles.playButtonActive
            ]}
            onPress={() => onPlayPress(verse)}
          >
            {isPlaying ? (
              <Square size={20} color="#fff" fill="#fff" />
            ) : (
              <Play size={22} color="#fff" fill="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={common.gapMd}>
        <InlineArabicWithHover
          verse={verse}
          inlineWordTranslations={settings.inlineWordTranslations}
          surahFontSize={settings.surahFontSize}
          arabicFontFamily={arabicFontFamily}
          common={common}
          styles={styles}
          onWordPress={setSelectedWord}
        />

        {settings.showTransliteration && verse.transliteration && (
          <Text style={styles.transliterationText}>{verse.transliteration}</Text>
        )}

        <View style={common.gapSm}>
          {renderTranslations()}
        </View>

        {renderWordTranslations()}
        {/* Outside renderWordTranslations: the hover-translation line opens it too, with the word boxes off */}
        <WordRootModal word={selectedWord} onClose={() => setSelectedWord(null)} onSearchRoot={goToRoot} />

        {/* Memorization inline control */}
        {showMemorization && (
          <View style={common.mtSm}>
            {!memOpen ? (
              <TouchableOpacity style={styles.memToggle} onPress={() => setMemOpen(true)}>
                <BrainCircuit size={18} color={theme.headerText} />
                <Text style={styles.memToggleText}>{t('verse.memorize')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.memPanel}>
                <View style={common.rowBetween}>
                  <Text style={common.textStrong}>{t('verse.until')}</Text>
                  <View style={common.rowGap}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setEndVerse(v => clamp(v - 1, verse.number, maxEnd))}
                    >
                      <Text style={styles.stepText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.memValue}>{endVerse}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setEndVerse(v => clamp(v + 1, verse.number, maxEnd))}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={common.rowBetween}>
                  <Text style={common.textStrong}>
                    {memMode === 'individual' ? t('verse.perVerse') : t('verse.repeatCount')}
                  </Text>
                  <View style={common.rowGap}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setRepeats(r => clamp(r - 1, 1, 99))}
                    >
                      <Text style={styles.stepText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.memValue}>{repeats}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setRepeats(r => clamp(r + 1, 1, 99))}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={common.rowBetween}>
                  <Text style={common.textStrong}>{t('verse.memorizationMode')}</Text>
                  <View style={styles.memToggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.memModeBtn,
                        styles.memModeBtnLeft,
                        memMode === 'range' && common.buttonPrimary
                      ]}
                      onPress={() => setMemMode('range')}
                    >
                      <Text style={[
                        styles.memModeText,
                        memMode === 'range' && common.buttonTextPrimary
                      ]}>{t('verse.range')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.memModeBtn,
                        styles.memModeBtnRight,
                        memMode === 'individual' && common.buttonPrimary
                      ]}
                      onPress={() => setMemMode('individual')}
                    >
                      <Text style={[
                        styles.memModeText,
                        memMode === 'individual' && common.buttonTextPrimary
                      ]}>{t('verse.verseByVerse')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={common.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.memButton, { backgroundColor: theme.primary }, !canStartMem && common.disabled]}
                    disabled={!canStartMem}
                    onPress={() => startMemorization(verse.surahNumber, verse.number, endVerse, repeats, memMode)}
                  >
                    <Text style={styles.memButtonText}>{t('verse.start')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.memButton, { backgroundColor: theme.accent }]} onPress={() => { cancelMemorization(); setMemOpen(false); }}>
                    <Text style={styles.memButtonText}>{t('verse.close')}</Text>
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

