import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
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
        dateTimeButton: {
            justifyContent: 'center',
        },
        cancelButtonText: {
            color: theme.text,
        },
    });
};
