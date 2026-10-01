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
        // The current surah's name, tapped to open the picker
        selectionChip: {
            ...common.row,
            alignSelf: 'center',
            gap: SPACING.xs,
        },
        navRow: {
            ...common.rowBetween,
            gap: SPACING.md,
            marginTop: SPACING.md,
            marginBottom: SPACING.sm,
            paddingTop: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        navCenter: {
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
