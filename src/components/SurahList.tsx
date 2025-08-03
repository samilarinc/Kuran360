import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Surah } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

interface SurahListProps {
  surahs: Surah[];
  onSurahSelect: (surah: Surah) => void;
}

interface SurahItemProps {
  surah: Surah;
  onPress: (surah: Surah) => void;
}

const SurahItem: React.FC<SurahItemProps> = ({ surah, onPress }) => (
  <TouchableOpacity
    style={styles.surahItem}
    onPress={() => onPress(surah)}
  >
    <View style={styles.surahNumber}>
      <Text style={styles.surahNumberText}>{surah.number}</Text>
    </View>
    <View style={styles.surahInfo}>
      <Text style={styles.surahName}>{surah.name}</Text>
      <Text style={styles.surahArabicName}>{surah.arabicName}</Text>
      <Text style={styles.surahDetails}>
        {surah.numberOfVerses} verses • {surah.isMeccan ? 'Meccan' : 'Medinan'}
      </Text>
    </View>
    <View style={styles.arrow}>
      <Text style={styles.arrowText}>›</Text>
    </View>
  </TouchableOpacity>
);

export const SurahList: React.FC<SurahListProps> = ({ surahs, onSurahSelect }) => {
  return (
    <FlatList
      data={surahs}
      renderItem={({ item }) => (
        <SurahItem surah={item} onPress={onSurahSelect} />
      )}
      keyExtractor={(item) => item.number.toString()}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  surahNumber: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  surahNumberText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  surahArabicName: {
    fontSize: FONT_SIZES.large,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
  },
  surahDetails: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  arrow: {
    marginLeft: SPACING.sm,
  },
  arrowText: {
    fontSize: FONT_SIZES.xlarge,
    color: COLORS.textSecondary,
  },
});
