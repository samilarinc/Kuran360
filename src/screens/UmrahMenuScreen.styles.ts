import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
    container: common.container,
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    header: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        color: theme.text,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.medium,
    },
    footer: {
        marginTop: SPACING.xl,
        padding: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    footerText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        color: theme.textSecondary,
    },
    });
};
