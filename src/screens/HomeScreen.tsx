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
import { quranData, loadAllVerses, ProgressCallback } from '../data/quranData';
import { Surah, QuranData } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>القرآن الكريم</Text>
          <Text style={styles.subtitle}>Kur'an-ı Kerim</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Kur'an verileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show download screen if data is not available
  if (!isDataAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>القرآن الكريم</Text>
          <Text style={styles.subtitle}>Kur'an-ı Kerim</Text>
        </View>
        <View style={styles.downloadContainer}>
          <View style={styles.downloadCard}>
            <Text style={styles.downloadTitle}>Kur'an-ı Kerim Meali</Text>
            <Text style={styles.downloadDescription}>
              Ayetleri okuyabilmek için Türkçe meal verilerini indirmeniz gerekmektedir.
              Bu işlem yaklaşık 66MB veri indirecektir.
            </Text>

            {downloading ? (
              <View style={styles.downloadProgress}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  %{Math.round(downloadProgress)} - {downloadStatus}
                </Text>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 10 }} />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadData}
              >
                <Text style={styles.downloadButtonText}>📥 Meal Verilerini İndir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>القرآن الكريم</Text>
        <Text style={styles.subtitle}>Kur'an-ı Kerim</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <SurahList
        surahs={surahs}
        onSurahSelect={handleSurahSelect}
        scrollToSurah={lastSelectedSurah}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.medium,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  settingsButton: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.lg,
    padding: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
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
    color: COLORS.textSecondary,
  },
  downloadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  downloadCard: {
    backgroundColor: '#FFFFFF',
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
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  downloadDescription: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});
