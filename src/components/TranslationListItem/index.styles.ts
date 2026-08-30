import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    translationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.xs,
        borderRadius: 12,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
    },
    firstTranslationItem: {
        marginTop: SPACING.xs,
    },
    lastTranslationItem: {
        marginBottom: 0,
    },
    selectedTranslationItem: {
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary,
    },
    favoriteTranslationItem: {
        backgroundColor: '#FFD700' + '15',
        borderColor: '#FFD700',
        borderWidth: 2,
    },
    translationMainContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    translationText: {
        flex: 1,
        fontSize: FONT_SIZES.small,
        color: theme.text,
        fontWeight: '500',
    },
    selectedTranslationText: {
        color: theme.primary,
        fontWeight: '600',
    },
    favoriteTranslationText: {
        color: '#B8860B',
        fontWeight: '700',
    },
    favoriteButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    modernCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    modernCheckboxSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
});
