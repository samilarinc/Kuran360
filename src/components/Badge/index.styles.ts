import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
    },
    withIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sizeSmall: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    sizeMedium: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
    },
    text: {
        fontWeight: '600',
    },
    textSmall: {
        fontSize: 10,
        fontWeight: '700',
    },
    textMedium: {
        fontSize: 12,
    },
});
