import { StyleSheet } from 'react-native';
import { Theme } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: theme.background,
    },
    card: {
        ...common.card,
        borderRadius: 12,
        padding: SPACING.xl,
        margin: SPACING.md,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    title: {
        ...common.titleLarge,
        color: theme.primary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    description: {
        ...common.subtitle,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    downloadButton: {
        minWidth: 200,
    },
    downloadButtonText: {
        color: theme.headerText,
    },
    });
};
