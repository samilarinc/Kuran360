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
import { ArabicText } from '../components/ArabicText';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { LoadingView } from '../components/LoadingView';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { Verse as VerseType } from '../types';
import { loadSurah } from '../data/quranData';
import { getVerseRangesForPage, TOTAL_MUSHAF_PAGES } from '../data/pageMapping';
import { getSurahNameByNumber } from '../utils/surahName';
import { createStyles } from './QuranPageScreen.styles';

const MIN_FONT_SIZE = 18;
const MAX_FONT_SIZE = 44;
const FONT_SIZE_STEP = 2;

const spacedArabicText = (verse: VerseType): string => {
  const words = verse.wordTranslations.map(w => w.arabic).filter(Boolean);
  return words.length > 0 ? words.join(' ') : verse.arabicText;
};

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
  const [pageInput, setPageInput] = useState(String(pageNumber));
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
    <SafeAreaView style={styles.container}>
      <HeaderWithDarkModeToggle
        title={t('quranPageScreen.pageTitle', { page: pageNumber })}
        subtitle={subtitle}
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
                <ArabicText
                  style={[
                    styles.pageArabicText,
                    { fontSize, lineHeight: fontSize * 2.2 },
                  ]}
                >
                  {segment.verses.map(verse => (
                    <React.Fragment key={verse.number}>
                      {spacedArabicText(verse)}
                      {' '}
                      <Text style={[styles.verseNumberMark, { fontSize: Math.max(14, fontSize * 0.6) }]}>
                        {`﴿${verse.number}﴾`}
                      </Text>
                      {' '}
                    </React.Fragment>
                  ))}
                </ArabicText>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.pagerBar}>
        <TouchableOpacity
          style={[styles.pagerButton, pageNumber <= 1 && styles.pagerButtonDisabled]}
          disabled={pageNumber <= 1}
          onPress={() => goToPage(pageNumber - 1)}
        >
          <Text style={styles.pagerButtonText}>{t('quranPageScreen.previousPage')}</Text>
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
          style={[styles.pagerButton, pageNumber >= TOTAL_MUSHAF_PAGES && styles.pagerButtonDisabled]}
          disabled={pageNumber >= TOTAL_MUSHAF_PAGES}
          onPress={() => goToPage(pageNumber + 1)}
        >
          <Text style={styles.pagerButtonText}>{t('quranPageScreen.nextPage')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
