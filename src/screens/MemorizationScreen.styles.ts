import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, RADIUS, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        content: {
            padding: SPACING.md,
            paddingBottom: SPACING.xl * 2,
            gap: SPACING.md,
        },
        warningCard: {
            ...common.row,
            gap: SPACING.sm,
            borderColor: theme.warning,
            backgroundColor: theme.warning + '14',
        },
        selectionCard: {
            ...common.rowBetween,
            gap: SPACING.md,
        },
        selectionCenter: {
            flex: 1,
            alignItems: 'center',
            gap: 2,
        },
        revealButton: {
            alignSelf: 'flex-end',
        },
        verseArabic: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.8,
        },
        hiddenVerse: {
            ...common.subtitle,
            textAlign: 'center',
            paddingVertical: SPACING.lg,
        },
        // Word states of a checked recitation: read right, read wrong, skipped
        wordOk: {
            backgroundColor: theme.success + '30',
            color: theme.text,
        },
        wordWrong: {
            backgroundColor: theme.error + '30',
            color: theme.error,
        },
        wordMissed: {
            backgroundColor: theme.error + '14',
            color: theme.error,
            textDecorationLine: 'underline',
        },
        legendRow: {
            ...common.rowWrap,
            gap: SPACING.md,
            marginTop: SPACING.sm,
        },
        legendItem: {
            ...common.row,
            gap: SPACING.xs,
        },
        legendSwatch: {
            width: 12,
            height: 12,
            borderRadius: RADIUS.sm / 2,
        },
        buttonRow: {
            ...common.rowWrap,
            gap: SPACING.sm,
        },
        transcript: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.8,
            textAlign: 'center',
        },
    });
};
