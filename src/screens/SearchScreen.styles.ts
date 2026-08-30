import { StyleSheet } from 'react-native';
import { Theme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme as any);

    return StyleSheet.create({
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    searchContainer: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingHorizontal: 0,
        marginBottom: SPACING.lg,
    },
    searchInput: {
        height: 50,
        backgroundColor: theme.cardBackground,
        borderRadius: 25,
        paddingHorizontal: SPACING.lg,
        borderWidth: 2,
        borderColor: theme.border,
    },
    scrollContentPadding: {
        padding: SPACING.lg,
    },
    });
};
