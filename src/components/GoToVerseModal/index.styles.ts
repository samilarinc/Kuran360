import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';
import { Theme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
    overlay: {
        ...common.modalOverlay,
        padding: 0,
    },
    searchLabel: {
        ...common.smallText,
        marginBottom: SPACING.xs,
    },
    verseList: {
        flex: 1,
        padding: SPACING.sm,
    },
    verseItem: {
        padding: SPACING.md,
        marginVertical: SPACING.xs,
        borderRadius: 8,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currentVerseItem: {
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary + '30',
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    verseNumber: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.primary,
    },
    currentVerseNumber: {
        color: theme.primary,
        fontWeight: 'bold',
    },
    currentLabel: {
        ...common.badge,
        ...common.badgeText,
        color: theme.primary,
        fontWeight: '500',
        backgroundColor: theme.primary + '20',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    versePreview: {
        ...common.smallText,
        lineHeight: 18,
    },
    currentVersePreview: {
        color: theme.text,
    },
    quickNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: theme.background,
    },
    quickNavButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: theme.primary + '20',
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
    },
    quickNavText: {
        fontSize: FONT_SIZES.small,
        color: theme.primary,
        fontWeight: '500',
    },
    });
};
