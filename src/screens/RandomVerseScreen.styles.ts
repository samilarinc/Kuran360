import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.lg,
        padding: SPACING.lg,
    },
    errorText: {
        fontSize: FONT_SIZES.large,
        textAlign: 'center',
        color: theme.text,
    },
    retryButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 8,
        backgroundColor: theme.primary,
    },
    retryButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    verseContainer: {
        flex: 1,
        position: 'relative',
    },
    verseContent: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: SPACING.xl * 3, // Extra space for surah info and bottom actions
        paddingHorizontal: SPACING.md,
    },
    surahInfoContainer: {
        padding: SPACING.md,
        margin: SPACING.md,
        marginBottom: SPACING.xl, // Extra bottom margin for better scroll space
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        backgroundColor: theme.surface,
    },
    surahInfoContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    surahNameSection: {
        alignItems: 'center',
    },
    surahName: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: 2,
        textAlign: 'center',
        color: theme.text,
    },
    surahArabicName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '500',
        textAlign: 'center',
        color: theme.textSecondary,
    },
    verseNumberBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 16,
        minWidth: 60,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        backgroundColor: theme.primary,
    },
    verseNumberLabel: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        marginBottom: 2,
        letterSpacing: 0.5,
        color: '#FFFFFF',
    },
    verseNumberText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    surahMetaInfo: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    metaChip: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary + '15',
    },
    metaText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
        color: theme.primary,
    },
    surahDetails: {
        fontSize: FONT_SIZES.small,
        fontStyle: 'italic',
    },
    bottomActions: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl, // Extra bottom padding for better accessibility
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: theme.surface,
    },
    swipeHint: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        marginBottom: SPACING.md,
        fontStyle: 'italic',
    },
    newVerseButton: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: theme.primary,
    },
    newVerseButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
