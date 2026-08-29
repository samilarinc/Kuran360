import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '@/theme';
import { TRANSLATION_FONT_FAMILY } from '@/constants/fonts';
import { createCommonStyles } from '@/theme/common.styles';

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
    versesRow: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
    },
    verseColumn: {
      // No explicit alignItems override: flex column defaults to 'stretch', so the
      // Arabic line and its translation both stretch to whichever of them is wider -
      // that's what keeps the two visually spanning about the same width.
      maxWidth: '100%',
      paddingHorizontal: SPACING.sm,
      paddingBottom: SPACING.lg,
    },
    verseColumnArabicText: {
      color: theme.text,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    verseColumnTranslationText: {
      marginTop: SPACING.xs,
      color: theme.text,
      textAlign: 'center',
      writingDirection: 'ltr',
      fontFamily: TRANSLATION_FONT_FAMILY,
      lineHeight: 1.5 * FONT_SIZES.medium,
    },
    wordByWordGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.xs,
    },
    wordByWordItem: {
      backgroundColor: theme.surface,
      paddingVertical: 4,
      paddingHorizontal: SPACING.xs,
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
    },
    wordByWordArabic: {
      fontSize: FONT_SIZES.small,
      color: theme.text,
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    wordByWordTranslation: {
      fontSize: FONT_SIZES.small - 2,
      color: theme.textSecondary,
      fontFamily: TRANSLATION_FONT_FAMILY,
      textAlign: 'center',
    },
    mealBar: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
      backgroundColor: theme.surface,
    },
    mealButton: {
      paddingVertical: SPACING.sm,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    mealButtonText: {
      color: theme.text,
      fontSize: FONT_SIZES.medium,
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
