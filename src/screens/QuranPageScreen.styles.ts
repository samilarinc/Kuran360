import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import { TRANSLATION_FONT_FAMILY } from '@/constants/fonts';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
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
    translationFont: {
      fontFamily: TRANSLATION_FONT_FAMILY,
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
