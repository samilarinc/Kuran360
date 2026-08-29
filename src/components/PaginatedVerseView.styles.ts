import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: theme.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    navButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 8,
        backgroundColor: theme.primary,
        minWidth: 80,
    },
    navButtonDisabled: {
        backgroundColor: theme.textSecondary + '30',
    },
    navButtonText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
    },
    navButtonTextDisabled: {
        color: theme.textSecondary,
    },
    verseInfo: {
        alignItems: 'center',
        flex: 1,
    },
    verseNumberButton: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.primary,
        borderWidth: 2,
        borderColor: '#ffffff30',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        // 3D effect with inner shadow simulation
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.2)',
        borderRightColor: 'rgba(0, 0, 0, 0.2)',
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
        borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    },
    verseNumberButtonText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    verseTotal: {
        fontSize: 14,
        fontWeight: '400',
        color: '#FFFFFF',
        opacity: 0.75,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    verseCounter: {
        fontSize: FONT_SIZES.small,
        color: '#FFFFFF',
        marginTop: 4,
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden', // Prevent content from showing outside bounds during animation
    },
    animatedContainer: {
        flex: 1,
        width: '100%',
    },
    verseContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.md,
        minHeight: '100%',
        justifyContent: 'center',
    },
    emptyVerseContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    emptyVerseText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    errorText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    pageIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        backgroundColor: theme.cardBackground,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.textSecondary + '40',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: theme.primary,
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    ellipsis: {
        color: theme.textSecondary,
        fontSize: FONT_SIZES.small,
        marginHorizontal: 4,
        lineHeight: 12,
    },
    moreIndicator: {
        color: theme.textSecondary,
        fontSize: FONT_SIZES.small,
        marginLeft: SPACING.xs,
    },
});
