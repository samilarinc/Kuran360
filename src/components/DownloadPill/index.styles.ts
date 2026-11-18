import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    // Bottom left, so it doesn't cover the resume button on the right
    pill: {
        position: 'absolute',
        left: SPACING.lg,
        bottom: SPACING.lg,
        maxWidth: '70%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: theme.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 24,
        zIndex: 10,
        ...SHADOW.md,
    },
    pillFailed: {
        backgroundColor: theme.error,
    },
    percent: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    label: {
        flexShrink: 1,
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
});
