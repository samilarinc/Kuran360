import { StyleSheet } from 'react-native';
import { Theme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';

export const createStyles = (_theme: Theme) => {
  return StyleSheet.create({
    searchContainer: {
      marginHorizontal: SPACING.md,
      marginTop: SPACING.md,
    },
  });
};
