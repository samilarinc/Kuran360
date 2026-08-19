import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.medium,
    color: theme.textSecondary,
  },
  loadingNote: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.small,
    color: theme.textSecondary,
  },
  listContainer: {
    paddingBottom: SPACING.xl,
  },
});
