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
import { quranData } from '../data/quranData';
import { Surah, QuranData } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

interface HomeScreenProps {
  navigation: any;
  onSurahSelect?: (surah: Surah) => void;
  lastSelectedSurah?: Surah;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onSurahSelect, lastSelectedSurah }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>القرآن الكريم</Text>
          <Text style={styles.subtitle}>Holy Quran</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Quran data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>القرآن الكريم</Text>
        <Text style={styles.subtitle}>Holy Quran</Text>
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
});
