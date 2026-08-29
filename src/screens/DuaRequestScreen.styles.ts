import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        ...common,
        centerContainer: {
            ...common.emptyState,
        },
        content: {
            flex: 1,
            padding: SPACING.md,
        },
        card: {
            ...common.infoCard,
            marginTop: SPACING.md,
            backgroundColor: theme.surface,
        },
        infoText: {
            ...common.text,
            marginBottom: SPACING.xl,
            textAlign: 'center',
            lineHeight: 24,
        },
        infoTextTargetName: {
            fontWeight: 'bold',
            color: theme.primary,
        },
        inputContainer: {
            marginBottom: SPACING.lg,
        },
        label: {
            ...common.smallText,
            fontWeight: 'bold',
            marginBottom: SPACING.xs,
        },
        input: {
            ...common.input,
            backgroundColor: theme.background,
            marginBottom: 0,
            fontSize: FONT_SIZES.medium,
        },
        textArea: {
            height: 120,
            textAlignVertical: 'top',
        },
        submitButton: {
            borderRadius: 12,
            padding: SPACING.lg,
            alignItems: 'center',
            marginTop: SPACING.md,
            backgroundColor: theme.primary,
        },
        submitButtonDisabled: {
            opacity: 0.7,
        },
        submitButtonText: {
            color: '#FFFFFF',
            fontSize: FONT_SIZES.medium,
            fontWeight: 'bold',
        },
        footerText: {
            ...common.emptyStateText,
            fontSize: FONT_SIZES.small,
            marginTop: SPACING.xl,
        },
        successIcon: {
            fontSize: 64,
            marginBottom: SPACING.lg,
        },
        successTitle: {
            ...common.titleLarge,
            marginBottom: SPACING.md,
        },
        successText: {
            ...common.subtitle,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: SPACING.xl,
        },
    });
};
