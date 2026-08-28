import { StyleSheet } from 'react-native';
import { SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
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
