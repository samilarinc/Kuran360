import { StyleSheet } from 'react-native';
import { SPACING } from '../theme';
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
        hatimCreator: {
            ...common.smallText,
            marginBottom: SPACING.md,
        },
        progressContainer: {
            marginTop: SPACING.sm,
        },
        progressBar: {
            marginBottom: SPACING.xs,
        },
        progressText: {
            ...common.smallText,
            textAlign: 'right',
        },
        emptyContainer: {
            padding: SPACING.xl,
            alignItems: 'center',
        },
        emptyText: {
            ...common.text,
            textAlign: 'center',
            opacity: 0.7,
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
        privateLabel: {
            fontSize: 12,
            color: '#f44336',
        },
        listWrapper: {
            flex: 1,
            maxWidth: 800,
            width: '100%',
            alignSelf: 'center',
        },
        emptyTextSecondary: {
            color: theme.textSecondary,
        },
        inputLabelNoMargin: {
            color: theme.textSecondary,
            marginTop: 0,
        },
        inputLabelSecondary: {
            color: theme.textSecondary,
        },
        webDateWrapper: {
            marginBottom: 16,
        },
        webDateInput: {
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: 'transparent',
            color: theme.text,
            marginBottom: 8,
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: '16px',
        } as any,
        webSelect: {
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: 'transparent',
            color: theme.text,
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: '16px',
            appearance: 'auto',
        } as any,
        timeSeparator: {
            marginHorizontal: 8,
            color: theme.text,
            fontSize: 18,
            fontWeight: '700',
        },
        dateTimeButton: {
            justifyContent: 'center',
        },
        modalButtonCancel: {
            backgroundColor: theme.border,
        },
        cancelButtonText: {
            color: theme.text,
        },
        modalButtonPrimary: {
            backgroundColor: theme.primary,
        },
        whiteText: {
            color: '#fff',
        },
    });
};
