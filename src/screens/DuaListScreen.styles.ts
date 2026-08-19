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
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: SPACING.sm,
        color: theme.text,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.primary,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
        borderWidth: 1,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZES.medium,
        backgroundColor: theme.background,
        color: theme.text,
        borderColor: theme.border,
    },
    submitButton: {
        borderRadius: 8,
        padding: SPACING.md,
        alignItems: 'center',
        backgroundColor: theme.primary,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: SPACING.lg,
        color: theme.textSecondary,
    },
    duaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    duaContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        borderColor: theme.border,
    },
    checkboxChecked: {
        backgroundColor: theme.primary,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    duaTextContainer: {
        flex: 1,
    },
    duaPerson: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: 2,
        color: theme.primary,
    },
    duaText: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    deleteButton: {
        padding: SPACING.sm,
    },
    deleteIcon: {
        fontSize: 18,
        color: '#666',
    },
    compactShareBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.lg,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    compactShareText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        color: theme.text,
    },
    compactCopyButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.primary,
    },
    compactCopyButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.small,
    },
    requestItem: {
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.sm,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    requestContent: {
        marginBottom: SPACING.md,
    },
    requestName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        color: theme.primary,
    },
    requestTopic: {
        fontSize: FONT_SIZES.medium,
        marginTop: 2,
        color: theme.text,
    },
    requestActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        padding: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonAccept: {
        backgroundColor: theme.primary,
    },
    actionButtonReject: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.textSecondary,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.small,
    },
    actionButtonTextReject: {
        color: theme.textSecondary,
    },
});
