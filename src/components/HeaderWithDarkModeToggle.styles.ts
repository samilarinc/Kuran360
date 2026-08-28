import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
  header: {
    backgroundColor: theme.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    position: 'relative',
    minHeight: 48,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: theme.headerText,
    marginBottom: 0,
    textAlign: 'center',
  },
  titleWithSubtitle: {
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.small,
    color: theme.headerText,
    opacity: 0.9,
    textAlign: 'center',
  },
  leftButton: {
    position: 'absolute',
    left: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  leftButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButtons: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    zIndex: 1,
  },
  autoplayToggleWrapper: {
    marginRight: SPACING.xs,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.headerText,
    fontSize: 18,
    fontWeight: '600',
  },
  homeButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  homeButtonText: {
    fontSize: 16,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
