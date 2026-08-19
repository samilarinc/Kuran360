import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    card: {
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: SPACING.md,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    infoText: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.xl,
        textAlign: 'center',
        lineHeight: 24,
        color: theme.text,
    },
    infoTextTargetName: {
        fontWeight: 'bold',
        color: theme.primary,
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        color: theme.textSecondary,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: FONT_SIZES.medium,
        backgroundColor: theme.background,
        color: theme.text,
        borderColor: theme.border,
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
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        marginTop: SPACING.xl,
        fontStyle: 'italic',
        color: theme.textSecondary,
    },
    successIcon: {
        fontSize: 64,
        marginBottom: SPACING.lg,
    },
    successTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        color: theme.text,
    },
    successText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
        color: theme.textSecondary,
    },
    backButton: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 12,
        backgroundColor: theme.primary,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
});
