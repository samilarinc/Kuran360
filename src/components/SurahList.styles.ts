import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: any) => StyleSheet.create({
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
