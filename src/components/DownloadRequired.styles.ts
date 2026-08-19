import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: theme.background,
    },
    card: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.xl,
        margin: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    title: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    description: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    downloadButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    downloadButtonText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
    },
});
