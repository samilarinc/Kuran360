import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
  const common = createCommonStyles(theme);

  return StyleSheet.create({
    container: common.container,
    content: {
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.xl,
      alignItems: 'center',
    },
    pageColumn: {
      width: '100%',
      maxWidth: 960,
    },
    surahHeader: {
      alignItems: 'center',
      marginTop: SPACING.lg,
      marginBottom: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    surahHeaderArabic: {
      fontSize: FONT_SIZES.xlarge,
      color: theme.text,
    },
    surahHeaderName: {
      fontSize: FONT_SIZES.small,
      color: theme.textSecondary,
      marginTop: SPACING.xs,
    },
    pageArabicText: {
      color: theme.text,
      textAlign: 'justify',
      writingDirection: 'rtl',
    },
    verseNumberMark: {
      fontSize: FONT_SIZES.medium,
      color: theme.primary,
      fontWeight: '600',
    },
    pagerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.surface,
    },
    pagerButton: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 90,
      alignItems: 'center',
    },
    pagerButtonDisabled: {
      opacity: 0.4,
    },
    pagerButtonText: {
      color: theme.text,
      fontSize: FONT_SIZES.medium,
      fontWeight: '600',
    },
    pageInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      color: theme.text,
      backgroundColor: theme.cardBackground,
      minWidth: 90,
      textAlign: 'center',
      fontSize: FONT_SIZES.medium,
    },
  });
};
