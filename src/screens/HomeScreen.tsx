import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SurahList } from '../components/SurahList';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { DownloadRequired } from '../components/DownloadRequired';
import { quranData } from '../data/quranData';
import { Surah } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';
import { useDownloadData } from '../hooks/useDownloadData';
import { useTranslation } from 'react-i18next';
import { getSurahName } from '../utils/surahName';

interface HomeScreenProps {
  navigation: any;
  onSurahSelect?: (surah: Surah) => void;
  lastSelectedSurah?: Surah;
  isDataAvailable: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  onSurahSelect,
  lastSelectedSurah,
  isDataAvailable
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    downloading,
    downloadProgress,
    downloadStatus,
    downloadedBytes,
    totalBytes: totalBytesFromDownload,
    handleDownloadData,
  } = useDownloadData({ isDataAvailable, navigation });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter surahs based on search query
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) {
      return surahs;
    }
    const query = searchQuery.toLocaleLowerCase('tr').trim();
    return surahs.filter(surah =>
      getSurahName(t, surah).toLocaleLowerCase('tr').includes(query) ||
      surah.arabicName.toLocaleLowerCase('tr').includes(query) ||
      surah.name.toLocaleLowerCase('tr').includes(query) ||
      surah.number.toString() === query
    );
  }, [surahs, searchQuery, t]);

  useEffect(() => {
    const loadData = () => {
      try {
        // Load basic surah metadata (without verses)
        setSurahs(quranData.surahs);
      } catch (error) {
        console.error('Error loading Quran data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSurahSelect = (surah: Surah) => {
    if (onSurahSelect) {
      onSurahSelect(surah);
    } else {
      navigation.navigate('SurahDetail', { surah });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={createStyles(theme).container}>
        <HeaderWithDarkModeToggle
          title={t('homeScreen.arabicTitle')}
          subtitle={t('homeScreen.subtitle')}
          showBackButton={true}
          onBackPress={() => navigation.navigate('Main')}
          showHomeButton={true}
          onHomePress={() => navigation.navigate('Main')}
        />
        <View style={createStyles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={createStyles(theme).loadingText}>{t('homeScreen.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show download screen if data is not available
  if (!isDataAvailable) {
    return (
      <SafeAreaView style={createStyles(theme).container}>
        <HeaderWithDarkModeToggle
          title={t('homeScreen.arabicTitle')}
          subtitle={t('homeScreen.subtitle')}
          showBackButton={true}
          onBackPress={() => navigation.navigate('Main')}
          showHomeButton={true}
          onHomePress={() => navigation.navigate('Main')}
        />
        <DownloadRequired
          title={t('homeScreen.downloadTitle')}
          description={t('homeScreen.downloadDescription')}
          totalBytes={totalBytesFromDownload}
          downloading={downloading}
          downloadProgress={downloadProgress}
          downloadStatus={downloadStatus}
          downloadedBytes={downloadedBytes}
          onDownloadPress={handleDownloadData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={createStyles(theme).container}>
      <HeaderWithDarkModeToggle
        title={t('homeScreen.arabicTitle')}
        subtitle={t('homeScreen.subtitle')}
        showBackButton={true}
        onBackPress={() => navigation.navigate('Main')}
      />
      <View style={createStyles(theme).searchContainer}>
        <TextInput
          style={createStyles(theme).searchInput}
          placeholder={t('homeScreen.searchPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={createStyles(theme).clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={createStyles(theme).clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <SurahList
        surahs={filteredSurahs}
        onSurahSelect={handleSurahSelect}
        scrollToSurah={lastSelectedSurah}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.medium,
    color: theme.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.medium,
    color: theme.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearButtonText: {
    fontSize: FONT_SIZES.medium,
    color: theme.textSecondary,
  },
});
