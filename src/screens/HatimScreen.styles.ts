import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        ...common,
        // Screen specific overrides or additions
        addButton: {
            position: 'absolute',
            right: SPACING.md,
            top: SPACING.lg,
            padding: SPACING.xs,
        },
        addIcon: {
            fontSize: 32,
            fontWeight: '300',
            color: theme.text,
        },
        fab: {
            position: 'absolute',
            right: SPACING.lg,
            bottom: SPACING.lg,
            width: 56,
            height: 56,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.27,
            shadowRadius: 4.65,
            zIndex: 100,
            backgroundColor: theme.primary,
        },
        fabIcon: {
            fontSize: 32,
            color: '#FFFFFF',
            fontWeight: '300',
        },
        hatimCard: {
            ...common.card,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: theme.border,
        },
        hatimHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.xs,
        },
        hatimTitle: {
            ...common.title,
            fontWeight: '600',
        },
        completedBadge: {
            backgroundColor: '#2E7D32',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
        },
        completedBadgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: '700',
        },
        hatimCreator: {
            fontSize: FONT_SIZES.small,
            marginBottom: SPACING.md,
            color: theme.textSecondary,
        },
        progressContainer: {
            marginTop: SPACING.sm,
        },
        progressBar: {
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: SPACING.xs,
            backgroundColor: theme.border,
        },
        progressFill: {
            height: '100%',
            backgroundColor: theme.primary,
        },
        progressText: {
            fontSize: 12,
            textAlign: 'right',
            color: theme.textSecondary,
        },
        emptyContainer: {
            padding: SPACING.xl,
            alignItems: 'center',
        },
        emptyText: {
            textAlign: 'center',
            fontSize: FONT_SIZES.medium,
            opacity: 0.7,
            color: theme.text,
        },
        textArea: {
            height: 80,
            textAlignVertical: 'top',
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: SPACING.sm,
        },
        modalButton: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderRadius: 12,
            marginLeft: SPACING.md,
            minWidth: 80,
            alignItems: 'center',
        },
        inputLabel: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: SPACING.xs,
            marginTop: SPACING.sm,
            color: theme.text,
        },
        toggleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
            paddingVertical: SPACING.xs,
        },
    });
};
