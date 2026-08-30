import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  surahItem: {
    backgroundColor: theme.cardBackground,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
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
  surahName: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    color: theme.text,
    marginBottom: SPACING.xs,
  },
  arrowText: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'normal',
    color: theme.textSecondary,
  },
});
