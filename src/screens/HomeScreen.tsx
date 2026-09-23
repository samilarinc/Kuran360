import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native';
import { SurahList } from '@/components/SurahList';
import { AppHeader } from '@/components/AppHeader';
import { DownloadRequired } from '@/components/DownloadRequired';
import { LoadingView } from '@/components/LoadingView';
import { SearchInput } from '@/components/SearchInput';
import { quranData } from '@/data/quranData';
import { Surah } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownloadData } from '@/hooks/useDownloadData';
import { useTranslation } from 'react-i18next';
import { getSurahName } from '@/utils/surahName';

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
  const { common } = useTheme();
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
      <SafeAreaView style={common.container}>
        <AppHeader
          title={t('homeScreen.arabicTitle')}
          subtitle={t('homeScreen.subtitle')}
          showBackButton={true}
          onBackPress={() => navigation.navigate('Main')}
          showHomeButton={true}
          onHomePress={() => navigation.navigate('Main')}
        />
        <LoadingView text={t('homeScreen.loading')} />
      </SafeAreaView>
    );
  }

  // Show download screen if data is not available
  if (!isDataAvailable) {
    return (
      <SafeAreaView style={common.container}>
        <AppHeader
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
    <SafeAreaView style={common.container}>
      <AppHeader
        title={t('homeScreen.arabicTitle')}
        subtitle={t('homeScreen.subtitle')}
        showBackButton={true}
        onBackPress={() => navigation.navigate('Main')}
        showHomeButton={true}
        onHomePress={() => navigation.navigate('Main')}
      />
      <SearchInput
        style={[common.mhMd, common.mtMd]}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('homeScreen.searchPlaceholder')}
        onClear={() => setSearchQuery('')}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <SurahList
        surahs={filteredSurahs}
        onSurahSelect={handleSurahSelect}
        scrollToSurah={lastSelectedSurah}
      />
    </SafeAreaView>
  );
};
