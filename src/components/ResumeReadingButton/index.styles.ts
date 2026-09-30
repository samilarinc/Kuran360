import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    button: {
        position: 'absolute',
        right: SPACING.lg,
        bottom: SPACING.lg,
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
    label: {
        color: theme.headerText,
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
});
