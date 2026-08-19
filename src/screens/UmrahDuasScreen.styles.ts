import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    description: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.lg,
        textAlign: 'center',
        fontStyle: 'italic',
        color: theme.textSecondary,
    },
    categoryContainer: {
        marginBottom: SPACING.md,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    categoryTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginRight: SPACING.xs,
        color: theme.text,
    },
    categoryCount: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
    },
    expandIcon: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
    },
    duasContainer: {
        marginTop: SPACING.sm,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.surface,
    },
    duaItem: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    duaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderColor: theme.border,
    },
    duaTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        flex: 1,
        color: theme.primary,
    },
    duaContent: {
        padding: SPACING.md,
        paddingTop: 0,
    },
    textBlock: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        color: theme.textSecondary,
    },
    arabicText: {
        fontSize: FONT_SIZES.xlarge,
        textAlign: 'right',
        lineHeight: 36,
        color: theme.text,
    },
    transliterationText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        lineHeight: 24,
        color: theme.text,
    },
    turkishText: {
        fontSize: FONT_SIZES.medium,
        lineHeight: 24,
        color: theme.text,
    },
});
