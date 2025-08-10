import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SurahList } from '../components/SurahList';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { quranData, loadAllVerses, ProgressCallback } from '../data/quranData';
import { Surah, QuranData } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

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
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');

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

  const handleDownloadData = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('İndirme başlatılıyor...');

    const progressCallback: ProgressCallback = (progress, status) => {
      setDownloadProgress(progress);
      setDownloadStatus(status);
    };

    try {
      await loadAllVerses(progressCallback);
      // After successful download, trigger a re-render by updating the App component
      const globalObj = globalThis as any;
      if (globalObj.window) {
        globalObj.window.location.reload();
      }
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('İndirme başarısız. Tekrar deneyin.');
    } finally {
      setDownloading(false);
    }
  };

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
          title="القرآن الكريم"
          subtitle="Kur'an-ı Kerim"
        />
        <View style={createStyles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={createStyles(theme).loadingText}>Kur'an verileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show download screen if data is not available
  if (!isDataAvailable) {
    return (
      <SafeAreaView style={createStyles(theme).container}>
        <HeaderWithDarkModeToggle
          title="القرآن الكريم"
          subtitle="Kur'an-ı Kerim"
        />
        <View style={createStyles(theme).downloadContainer}>
          <View style={createStyles(theme).downloadCard}>
            <Text style={createStyles(theme).downloadTitle}>Kur'an-ı Kerim Meali</Text>
            <Text style={createStyles(theme).downloadDescription}>
              Ayetleri okuyabilmek için Türkçe meal verilerini indirmeniz gerekmektedir.
              Bu işlem yaklaşık 66MB veri indirecektir.
            </Text>

            {downloading ? (
              <View style={createStyles(theme).downloadProgress}>
                <View style={createStyles(theme).progressBarContainer}>
                  <View style={[createStyles(theme).progressBar, { width: `${downloadProgress}%` }]} />
                </View>
                <Text style={createStyles(theme).progressText}>
                  %{Math.round(downloadProgress)} - {downloadStatus}
                </Text>
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 10 }} />
              </View>
            ) : (
              <TouchableOpacity
                style={createStyles(theme).downloadButton}
                onPress={handleDownloadData}
              >
                <Text style={createStyles(theme).downloadButtonText}>📥 Meal Verilerini İndir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={createStyles(theme).container}>
      <HeaderWithDarkModeToggle
        title="القرآن الكريم"
        subtitle="Kur'an-ı Kerim"
        showLogo={true}
        onLogoPress={() => navigation.navigate('Main')}
        showSettingsButton={true}
        onSettingsPress={() => navigation.navigate('Settings')}
        showSearchButton={true}
        onSearchPress={() => navigation.navigate('Search')}
      />
      <SurahList
        surahs={surahs}
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
  downloadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  downloadCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: SPACING.xl,
    margin: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    maxWidth: 400,
  },
  downloadTitle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  downloadDescription: {
    fontSize: FONT_SIZES.medium,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  downloadButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: theme.headerText,
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
  },
  downloadProgress: {
    alignItems: 'center',
    width: '100%',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.medium,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});
