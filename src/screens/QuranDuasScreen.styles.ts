import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    // Vertical only: the verse cards bring their own side margin, like in the reader
    list: {
        paddingVertical: SPACING.md,
        paddingBottom: SPACING.xl * 2,
    },
    listHeader: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.xs,
        gap: SPACING.xs,
    },
    modeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    categoryRow: {
        gap: SPACING.xs,
        paddingRight: SPACING.md,
    },
    summary: {
        ...common.smallText,
    },
    sectionTitle: {
        ...common.groupLabel,
        marginTop: SPACING.lg,
        marginBottom: 0,
        marginLeft: SPACING.md + SPACING.xs,
        marginRight: SPACING.md + SPACING.xs,
    },
    // Who made the dua and where, above its verse cards
    duaHeader: {
        marginTop: SPACING.md,
        marginHorizontal: SPACING.md + SPACING.xs,
        gap: 2,
    },
    duaWho: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '700',
        color: theme.primary,
    },
    duaContext: {
        ...common.smallText,
    },
});
