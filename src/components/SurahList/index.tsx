import React, { useRef, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { useTranslation } from 'react-i18next';
import { Surah } from '@/types';
import { useTheme, Theme, useThemedStyles } from '@/contexts/ThemeContext';
import { getSurahName } from '@/utils/surahName';
import { MenuListRow } from '../MenuListRow';
import { FONT_SIZES, SPACING } from '@/theme';

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
  const { common } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <MenuListRow
      variant="list"
      containerStyle={styles.surahItem}
      icon={String(surah.number)}
      iconColor={theme.primary}
      iconStyle={styles.surahNumber}
      iconTextStyle={styles.surahNumberText}
      title={getSurahName(t, surah)}
      titleStyle={common.title}
      subtitle={surah.arabicName}
      caption={`${surah.verseCount} ayet • ${surah.revelationPlace}`}
      chevronStyle={styles.arrowText}
      onPress={() => onPress(surah)}
    />
  );
};

export const SurahList: React.FC<SurahListProps> = ({ surahs, onSurahSelect, scrollToSurah }) => {
  const flatListRef = useRef<FlatList>(null);
  const { theme, common } = useTheme();

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
      contentContainerStyle={common.pMd}
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

const createStyles = (theme: Theme) => StyleSheet.create({
  surahItem: {
    backgroundColor: theme.cardBackground,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...SHADOW.sm,
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
  arrowText: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'normal',
    color: theme.textSecondary,
  },
});
