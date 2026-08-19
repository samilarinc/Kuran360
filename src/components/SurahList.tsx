import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Surah } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { getSurahName } from '../utils/surahName';
import { createStyles } from './SurahList.styles';

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

const SurahItem: React.FC<SurahItemProps> = ({ surah, onPress, theme }) => {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
  <TouchableOpacity
    style={styles.surahItem}
    onPress={() => onPress(surah)}
  >
    <View style={styles.surahNumber}>
      <Text style={styles.surahNumberText}>{surah.number}</Text>
    </View>
    <View style={styles.surahInfo}>
      <Text style={styles.surahName}>{getSurahName(t, surah)}</Text>
      <Text style={styles.surahArabicName}>{surah.arabicName}</Text>
      <Text style={styles.surahDetails}>
        {surah.verseCount} ayet • {surah.revelationPlace}
      </Text>
    </View>
    <View style={styles.arrow}>
      <Text style={styles.arrowText}>›</Text>
    </View>
  </TouchableOpacity>
  );
};

export const SurahList: React.FC<SurahListProps> = ({ surahs, onSurahSelect, scrollToSurah }) => {
  const flatListRef = useRef<FlatList>(null);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      // Disable virtualization since we only have 114 surahs - this ensures
      // all items are always rendered and scrollToIndex works reliably
      removeClippedSubviews={false}
      windowSize={150} // Render more items at once
      maxToRenderPerBatch={150} // Render all items in one batch
      initialNumToRender={114} // Render all items initially
      // Remove getItemLayout to let FlatList calculate positions accurately
      // This is more reliable for scrollToIndex positioning
      onScrollToIndexFailed={(info) => {
        // This should rarely happen now, but keep as fallback
        const wait = new Promise<void>(resolve => setTimeout(resolve, 500));
        wait.then(() => {
          flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
        });
      }}
    />
  );
};
