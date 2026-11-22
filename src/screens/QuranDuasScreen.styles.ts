import { StyleSheet } from 'react-native';
import { FONT_SIZES, RADIUS, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    // Grouping and person/topic picker, fixed above the list
    filters: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
        backgroundColor: theme.background,
    },
    orderNote: {
        ...common.smallText,
        paddingHorizontal: SPACING.xs,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        minHeight: 48,
        paddingLeft: SPACING.xs + 2,
        paddingRight: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.cardBackground,
    },
    // Gilded icon on the deep green, like the featured block on the main menu
    pickerIcon: {
        width: 34,
        height: 34,
        borderRadius: RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.featured,
    },
    pickerValue: {
        flex: 1,
        fontSize: FONT_SIZES.medium,
        fontWeight: '700',
        color: theme.text,
    },
    pickerCount: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.accent,
    },

    // Vertical only: the verse cards bring their own side margin, like in the reader
    list: {
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.xl * 2,
    },
    // A person or topic heading: name, a gilded rule, the number of its duas
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
        marginHorizontal: SPACING.md + SPACING.xs,
    },
    sectionTitle: {
        flexShrink: 1,
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        color: theme.primary,
    },
    sectionRule: {
        flex: 1,
        height: 1,
        backgroundColor: theme.accent + '55',
    },
    sectionCount: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.accent,
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

    // Person/topic bottom sheet
    sheetHeader: {
        paddingTop: SPACING.sm,
        borderBottomColor: theme.border,
    },
    sheetList: {
        paddingHorizontal: SPACING.sm,
        paddingTop: SPACING.xs,
    },
    sheetGroupLabel: {
        ...common.groupLabel,
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.sm,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        minHeight: 44,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.sm,
    },
    sheetOptionSelected: {
        backgroundColor: theme.primary + '12',
    },
    sheetOptionText: {
        flex: 1,
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    sheetOptionTextSelected: {
        color: theme.primary,
        fontWeight: '700',
    },
    sheetOptionCount: {
        minWidth: 24,
        textAlign: 'right',
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.accent,
    },
});
