import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontSizeToggle } from '@msarinc/ui';
import { ArabicText } from '@/components/ArabicText';
import { AppHeader } from '@/components/AppHeader';
import { LoadingView } from '@/components/LoadingView';
import { TranslationPickerModal, TranslationPickerOption } from '@/components/TranslationPickerModal';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Verse as VerseType, WordTranslation } from '@/types';
import { loadSurah } from '@/data/quranData';
import { getVerseRangesForPage, TOTAL_MUSHAF_PAGES } from '@/data/pageMapping';
import { getSurahNameByNumber } from '@/utils/surahName';
import { formatVerseNumber } from '@/utils/numerals';
import { getSpacedArabicText, getWordSegments } from '@/utils/arabicText';
import { WordRootModal } from '@/components/WordRootModal';
import { createStyles } from './QuranPageScreen.styles';

const MIN_FONT_SIZE = 18;
const MAX_FONT_SIZE = 44;
const FONT_SIZE_STEP = 2;

const NO_TRANSLATION_ID = '';
const WORD_BY_WORD_TRANSLATION_ID = '__word_by_word__';

interface PageSegment {
  surahNumber: number;
  surahArabicName: string;
  isSurahStart: boolean;
  verses: VerseType[];
}

interface QuranPageScreenProps {
  route: {
    params: {
      pageNumber?: number;
    };
  };
  navigation: any;
  updatePageUrl?: (pageNumber: number) => void;
}

export const QuranPageScreen: React.FC<QuranPageScreenProps> = ({
  route,
  navigation,
  updatePageUrl,
}) => {
  const [pageNumber, setPageNumber] = useState(
    Math.min(Math.max(route.params.pageNumber ?? 1, 1), TOTAL_MUSHAF_PAGES)
  );
  const [segments, setSegments] = useState<PageSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<WordTranslation | null>(null);
  const [pageInput, setPageInput] = useState(String(pageNumber));
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const { theme, common } = useTheme();
  const { t } = useTranslation();
  const { settings, updateSettings, availableTranslations } = useSettings();
  const styles = useThemedStyles(createStyles);

  const translationOptions: TranslationPickerOption[] = useMemo(() => [
    { id: NO_TRANSLATION_ID, label: t('quranPageScreen.noTranslation') },
    { id: WORD_BY_WORD_TRANSLATION_ID, label: t('quranPageScreen.wordByWordTranslation') },
    ...availableTranslations.map(name => ({ id: name, label: name })),
  ], [availableTranslations, t]);

  const selectedTranslationLabel = translationOptions.find(o => o.id === settings.quranPageTranslation)?.label
    ?? t('quranPageScreen.noTranslation');

  // Follow external navigation (back/forward) to a different page
  useEffect(() => {
    const targetPage = route.params.pageNumber ?? 1;
    if (targetPage !== pageNumber) {
      setPageNumber(Math.min(Math.max(targetPage, 1), TOTAL_MUSHAF_PAGES));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.pageNumber]);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      setLoading(true);
      setPageInput(String(pageNumber));
      updatePageUrl?.(pageNumber);

      const ranges = getVerseRangesForPage(pageNumber);
      const loadedSegments: PageSegment[] = [];

      for (const [surahNumber, fromVerse, toVerse] of ranges) {
        const surah = await loadSurah(surahNumber);
        if (!surah) continue;
        const verses = surah.verses.filter(v => v.number >= fromVerse && v.number <= toVerse);
        loadedSegments.push({
          surahNumber,
          surahArabicName: surah.arabicName,
          isSurahStart: fromVerse === 1,
          verses,
        });
      }

      if (!cancelled) {
        setSegments(loadedSegments);
        setLoading(false);
      }
    };

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [pageNumber, updatePageUrl]);

  const goToPage = (target: number) => {
    const clamped = Math.min(Math.max(target, 1), TOTAL_MUSHAF_PAGES);
    setPageNumber(clamped);
  };

  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const subtitle = segments.length > 0
    ? segments.map(seg => getSurahNameByNumber(t, seg.surahNumber)).join(' • ')
    : undefined;

  const fontSize = settings.quranPageFontSize;
  const decreaseFontSize = () => updateSettings({ quranPageFontSize: Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP) });
  const increaseFontSize = () => updateSettings({ quranPageFontSize: Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP) });

  return (
    <SafeAreaView style={common.container}>
      <AppHeader
        title={subtitle}
        showBackButton
        onBackPress={() => navigation.goBack()}
        showHomeButton
        onHomePress={() => navigation.navigate('Main')}
        fontSizeToggle={
          <FontSizeToggle
            onDecrease={decreaseFontSize}
            onIncrease={increaseFontSize}
            disabledDecrease={fontSize <= MIN_FONT_SIZE}
            disabledIncrease={fontSize >= MAX_FONT_SIZE}
            labels={{
              decrease: t('quranPageScreen.decreaseFontSize'),
              increase: t('quranPageScreen.increaseFontSize'),
            }}
          />
        }
      />

      {loading ? (
        <LoadingView text={t('quranPageScreen.loading')} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageColumn}>
            {segments.map(segment => (
              <View key={segment.surahNumber}>
                {segment.isSurahStart && (
                  <View style={styles.surahHeader}>
                    <ArabicText style={styles.surahHeaderArabic}>{segment.surahArabicName}</ArabicText>
                    <Text style={styles.surahHeaderName}>
                      {getSurahNameByNumber(t, segment.surahNumber)}
                    </Text>
                  </View>
                )}
                {settings.quranPageTranslation === NO_TRANSLATION_ID ? (
                  // Mushaf mode: verses flow together in one continuous, justified paragraph.
                  <ArabicText
                    style={[
                      styles.pageArabicText,
                      { fontSize, lineHeight: fontSize * 2.2 },
                    ]}
                  >
                    {segment.verses.map(verse => (
                      <React.Fragment key={verse.number}>
                        {getSpacedArabicText(verse)}
                        {'\u00A0'}
                        <Text style={[styles.verseNumberMark, { fontSize: Math.max(14, fontSize * 0.6) }]}>
                          {`\ufd3f${formatVerseNumber(verse.number, settings.verseNumberStyle)}\ufd3e`}
                        </Text>
                        {' '}
                      </React.Fragment>
                    ))}
                  </ArabicText>
                ) : (
                  // Translation mode: verses still share lines like a normal wrapping paragraph
                  // (via flex-wrap), but each verse is its own column so its translation renders
                  // directly underneath it, naturally spanning about the same width as the verse.
                  <View style={styles.versesRow}>
                    {segment.verses.map(verse => (
                      <View key={verse.number} style={styles.verseColumn}>
                        <ArabicText
                          style={[
                            styles.verseColumnArabicText,
                            { fontSize, lineHeight: fontSize * 2.2 },
                          ]}
                        >
                          {getSpacedArabicText(verse)}
                          {'\u00A0'}
                          <Text style={[styles.verseNumberMark, { fontSize: Math.max(14, fontSize * 0.6) }]}>
                            {`\ufd3e${formatVerseNumber(verse.number, settings.verseNumberStyle)}\ufd3f`}
                          </Text>
                        </ArabicText>

                        {settings.quranPageTranslation === WORD_BY_WORD_TRANSLATION_ID ? (
                          <View style={styles.wordByWordGrid}>
                            {getWordSegments(verse).map((word, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={[common.wordItem, settings.showWordRoots && !!word.root && common.wordItemWithRoot]}
                                disabled={!settings.showWordRoots || !word.root}
                                onPress={() => setSelectedWord(word)}
                              >
                                <ArabicText style={common.wordArabic}>{word.arabic}</ArabicText>
                                <Text style={[common.wordTranslation, styles.translationFont]}>{word.translation}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.verseColumnTranslationText, { fontSize: Math.max(14, fontSize * 0.65) }]}>
                            {verse.allTranslations?.[settings.quranPageTranslation] || verse.translation}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.pagerBar}>
        <TouchableOpacity
          style={[styles.pagerButton, pageNumber <= 1 && common.disabled]}
          disabled={pageNumber <= 1}
          onPress={() => goToPage(pageNumber - 1)}
        >
          <Text style={common.textStrong}>{t('quranPageScreen.previousPage')}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.pageInput}
          value={pageInput}
          onChangeText={setPageInput}
          onSubmitEditing={handlePageInputSubmit}
          onBlur={handlePageInputSubmit}
          keyboardType="number-pad"
          placeholder={`1-${TOTAL_MUSHAF_PAGES}`}
          placeholderTextColor={theme.textSecondary}
        />

        <TouchableOpacity
          style={[styles.pagerButton, pageNumber >= TOTAL_MUSHAF_PAGES && common.disabled]}
          disabled={pageNumber >= TOTAL_MUSHAF_PAGES}
          onPress={() => goToPage(pageNumber + 1)}
        >
          <Text style={common.textStrong}>{t('quranPageScreen.nextPage')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mealBar}>
        <TouchableOpacity
          style={styles.mealButton}
          onPress={() => setTranslationModalVisible(true)}
        >
          <Text style={common.textStrong} numberOfLines={1}>
            {t('quranPageScreen.translationLabel', { translation: selectedTranslationLabel })}
          </Text>
        </TouchableOpacity>
      </View>

      <WordRootModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        onSearchRoot={(root) => navigation.navigate('RootVerses', { root })}
      />

      <TranslationPickerModal
        visible={translationModalVisible}
        title={t('quranPageScreen.chooseTranslation')}
        options={translationOptions}
        selectedId={settings.quranPageTranslation}
        onSelect={(id) => updateSettings({ quranPageTranslation: id })}
        onClose={() => setTranslationModalVisible(false)}
      />
    </SafeAreaView>
  );
};
