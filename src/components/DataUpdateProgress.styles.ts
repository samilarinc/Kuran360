import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    downloadProgress: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: SPACING.md,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        backgroundColor: theme.border + '40',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: theme.primary,
    },
    progressText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        marginBottom: SPACING.sm,
        lineHeight: 20,
        color: theme.textSecondary,
    },
    activityIndicator: {
        marginTop: 10,
    },
});
