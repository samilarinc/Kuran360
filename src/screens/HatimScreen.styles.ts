import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

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
            ...SHADOW.md,
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
        hatimTitle: {
            ...common.title,
            fontWeight: '600',
        },
        hatimCreator: {
            ...common.smallText,
            marginBottom: SPACING.md,
        },
        progressText: {
            ...common.smallText,
            textAlign: 'right',
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
        inputLabelNoMargin: {
            color: theme.textSecondary,
            marginTop: 0,
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
    });
};
