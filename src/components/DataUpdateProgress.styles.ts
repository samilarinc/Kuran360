import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';

export const createStyles = (theme: any) => StyleSheet.create({
    downloadProgress: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: SPACING.md,
    },
    progressBarContainer: {
        marginBottom: SPACING.md,
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
