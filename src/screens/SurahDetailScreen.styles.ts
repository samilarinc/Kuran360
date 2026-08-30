import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    listContainer: {
      paddingBottom: SPACING.xl,
    },
  });
};
