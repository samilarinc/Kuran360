import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Bookmark, Library, Share2, Play, Square, BrainCircuit } from 'lucide-react-native';
import { Verse as VerseType, VerseShareData } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { getFontOption, getArabicFontFamily } from '@/constants/fonts';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { ShareModal } from '../ShareModal';
import { ArabicText } from '../ArabicText';
import { ShareService } from '@/utils/shareUtils';
import { getSurahsList } from '@/data/quranData';
import { useTranslation } from 'react-i18next';
import { getSurahNameByNumber } from '@/utils/surahName';
import { formatVerseNumber } from '@/utils/numerals';
import { createStyles } from './index.styles';
import { createCommonStyles } from '@/theme/common.styles';

const BOOKMARK_COLOR = '#F43F5E';
const ALL_TRANSLATIONS_COLOR = '#6366F1';
const SHARE_COLOR = '#F97316';
const PLAY_COLOR = '#10B981';

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
  const { t } = useTranslation();
  const arabicFontOption = getFontOption(settings.arabicFont);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const common = useMemo(() => createCommonStyles(theme), [theme]);
  // Matches common.arabicText's fontWeight: '600' below
  const arabicFontFamily = getArabicFontFamily(arabicFontOption, true);
  const { user } = useAuth();
  const { addBookmark, removeBookmark, isBookmarked, bookmarks } = useUserData();
  const { startMemorization, cancelMemorization } = useGlobalAudio();
  const [memOpen, setMemOpen] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
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
        <Text style={styles.sectionTitle}>Kelime Çevirileri:</Text>
        <View style={styles.wordTranslationsGrid}>
          {verse.wordTranslations.map((word, index) => (
            <View key={index} style={styles.wordTranslationItem}>
              <ArabicText style={styles.wordArabic}>{word.arabic}</ArabicText>
              <Text style={styles.wordTranslation}>{word.translation}</Text>
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
      return (
        <ArabicText style={[common.arabicText, { fontSize: settings.surahFontSize, lineHeight: settings.surahFontSize * 1.5 }]}>
          {verse.arabicText}
        </ArabicText>
      );
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
      <View style={styles.inlineArabicRow}>
        {tokens.map((tok, idx) => {
          const tr = map.get(tok);
          const isHover = hoveredIndex === idx && !!tr;
          return (
            <View key={idx} style={styles.inlineArabicWordWrap}>
              <Text
                style={[
                  common.arabicText,
                  { fontFamily: arabicFontFamily, fontSize: settings.surahFontSize, lineHeight: settings.surahFontSize * 1.5 },
                  styles.inlineArabicWord,
                  isHover && styles.inlineArabicWordHover,
                ]}
                // @ts-ignore web-only hover handlers
                onMouseEnter={() => setHoveredIndex(idx)}
                // @ts-ignore
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {tok}
              </Text>
              {isHover && (
                <View style={styles.hoverCard}>
                  <Text style={styles.hoverCardText}>{tr}</Text>
                </View>
              )}
              {/* Space between words, preserved visually on web */}
              {idx < tokens.length - 1 && <Text style={styles.inlineSpace}> </Text>}
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

  // Share data için gerekli bilgileri hazırla
  const shareData: VerseShareData = useMemo(() => {
    const surahName = getSurahNameByNumber(t, verse.surahNumber);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.verseNumber}>
          <Text style={styles.verseNumberText}>{formatVerseNumber(verse.number, settings.verseNumberStyle)}</Text>
        </View>
        <View style={styles.headerActions}>
          {showBookmarkButton && user && (
            <TouchableOpacity
              style={[styles.bookmarkButton, { backgroundColor: BOOKMARK_COLOR + '1A', borderColor: BOOKMARK_COLOR }]}
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
              style={[styles.allTranslationsButton, { backgroundColor: ALL_TRANSLATIONS_COLOR + '1A', borderColor: ALL_TRANSLATIONS_COLOR }]}
              onPress={() => navigation.navigate('AllTranslations', { verse })}
            >
              <Library size={18} color={ALL_TRANSLATIONS_COLOR} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: SHARE_COLOR + '1A', borderColor: SHARE_COLOR }]}
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

      <View style={styles.content}>
        <InlineArabicWithHover />

        {settings.showTransliteration && verse.transliteration && (
          <Text style={styles.transliterationText}>{verse.transliteration}</Text>
        )}

        <View style={styles.translationsContainer}>
          {renderTranslations()}
        </View>

        {renderWordTranslations()}

        {/* Memorization inline control */}
        {showMemorization && (
          <View style={styles.memContainer}>
            {!memOpen ? (
              <TouchableOpacity style={styles.memToggle} onPress={() => setMemOpen(true)}>
                <BrainCircuit size={18} color={theme.headerText} />
                <Text style={styles.memToggleText}>Ezberle</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.memPanel}>
                <View style={styles.memRow}>
                  <Text style={styles.memLabel}>Şuraya Kadar</Text>
                  <View style={styles.memStepper}>
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
                <View style={styles.memRow}>
                  <Text style={styles.memLabel}>
                    {memMode === 'individual' ? 'Her Ayet İçin' : 'Tekrar Sayısı'}
                  </Text>
                  <View style={styles.memStepper}>
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
                <View style={styles.memRow}>
                  <Text style={styles.memLabel}>Ezber Modu</Text>
                  <View style={styles.memToggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.memModeBtn,
                        styles.memModeBtnLeft,
                        memMode === 'range' && styles.memModeBtnActive
                      ]}
                      onPress={() => setMemMode('range')}
                    >
                      <Text style={[
                        styles.memModeText,
                        memMode === 'range' && styles.memModeTextActive
                      ]}>Aralık</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.memModeBtn,
                        styles.memModeBtnRight,
                        memMode === 'individual' && styles.memModeBtnActive
                      ]}
                      onPress={() => setMemMode('individual')}
                    >
                      <Text style={[
                        styles.memModeText,
                        memMode === 'individual' && styles.memModeTextActive
                      ]}>Ayet Ayet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.memActions}>
                  <TouchableOpacity
                    style={[styles.memStartBtn, !canStartMem && styles.memStartBtnDisabled]}
                    disabled={!canStartMem}
                    onPress={() => startMemorization(verse.surahNumber, verse.number, endVerse, repeats, memMode)}
                  >
                    <Text style={styles.memStartText}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.memCancelBtn} onPress={() => { cancelMemorization(); setMemOpen(false); }}>
                    <Text style={styles.memCancelText}>Close</Text>
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

