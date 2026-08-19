import { StyleSheet, Platform } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
    },
    verseHeader: {
        backgroundColor: theme.cardBackground,
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    arabicText: {
        fontSize: FONT_SIZES.arabic,
        lineHeight: FONT_SIZES.arabic * 1.5,
        textAlign: 'right',
        color: theme.text,
        fontWeight: '600',
        writingDirection: 'rtl',
        marginBottom: SPACING.sm,
        fontFamily: Platform.select({
            web: '"Scheherazade New", "Noto Naskh Arabic", Amiri, serif',
            default: undefined as any,
        }),
    },
    verseInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    surahInfo: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    verseNumber: {
        backgroundColor: theme.primary,
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
    },
    translationsContainer: {
        flex: 1,
    },
    translationItem: {
        backgroundColor: theme.cardBackground,
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.xs,
        padding: SPACING.md,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    favoriteTranslationItem: {
        backgroundColor: '#FFD700' + '10',
        borderLeftColor: '#FFD700',
    },
    translationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    translationName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.primary,
        flex: 1,
    },
    favoriteTranslationName: {
        color: '#B8860B',
        fontWeight: '700',
    },
    shareButton: {
        backgroundColor: theme.secondary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 8,
        marginLeft: SPACING.sm,
    },
    shareButtonText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    translationText: {
        fontSize: FONT_SIZES.medium,
        lineHeight: FONT_SIZES.medium * 1.4,
        color: theme.text,
        textAlign: 'left',
    },
    favoriteTranslationText: {
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyStateText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
    },
});
