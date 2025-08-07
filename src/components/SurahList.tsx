import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Surah } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

interface SurahListProps {
  surahs: Surah[];
  onSurahSelect: (surah: Surah) => void;
  scrollToSurah?: Surah;
}

interface SurahItemProps {
  surah: Surah;
  onPress: (surah: Surah) => void;
  theme: Theme;
}

const SurahItem: React.FC<SurahItemProps> = ({ surah, onPress, theme }) => (
  <TouchableOpacity
    style={createStyles(theme).surahItem}
    onPress={() => onPress(surah)}
  >
    <View style={createStyles(theme).surahNumber}>
      <Text style={createStyles(theme).surahNumberText}>{surah.number}</Text>
    </View>
    <View style={createStyles(theme).surahInfo}>
      <Text style={createStyles(theme).surahName}>{surah.turkishName || surah.name}</Text>
      <Text style={createStyles(theme).surahArabicName}>{surah.arabicName}</Text>
      <Text style={createStyles(theme).surahDetails}>
        {surah.verseCount} ayet • {surah.revelationPlace}
      </Text>
    </View>
    <View style={createStyles(theme).arrow}>
      <Text style={createStyles(theme).arrowText}>›</Text>
    </View>
  </TouchableOpacity>
);

export const SurahList: React.FC<SurahListProps> = ({ surahs, onSurahSelect, scrollToSurah }) => {
  const flatListRef = useRef<FlatList>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (scrollToSurah && flatListRef.current) {
      // Find the index of the surah to scroll to
      const index = surahs.findIndex(surah => surah.number === scrollToSurah.number);
      if (index !== -1) {
        // Use a timeout to ensure the FlatList is fully rendered
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5, // Center the item in the view
          });
        }, 100);
      }
    }
  }, [scrollToSurah, surahs]);

  return (
    <FlatList
      ref={flatListRef}
      data={surahs}
      renderItem={({ item }) => (
        <SurahItem surah={item} onPress={onSurahSelect} theme={theme} />
      )}
      keyExtractor={(item) => item.number.toString()}
      contentContainerStyle={createStyles(theme).container}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={(info) => {
        // Handle the case where scrollToIndex fails
        const wait = new Promise<void>(resolve => setTimeout(resolve, 500));
        wait.then(() => {
          flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
        });
      }}
    />
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    marginVertical: SPACING.xs,
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
  surahNumber: {
    backgroundColor: theme.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  surahNumberText: {
    color: theme.headerText,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    color: theme.text,
    marginBottom: SPACING.xs,
  },
  surahArabicName: {
    fontSize: FONT_SIZES.large,
    color: theme.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
  },
  surahDetails: {
    fontSize: FONT_SIZES.small,
    color: theme.textSecondary,
  },
  arrow: {
    marginLeft: SPACING.sm,
  },
  arrowText: {
    fontSize: FONT_SIZES.xlarge,
    color: theme.textSecondary,
  },
});
