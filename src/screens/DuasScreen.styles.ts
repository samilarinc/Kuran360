import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    audioBar: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
    },
    content: {
        paddingVertical: SPACING.sm,
        paddingBottom: SPACING.xl * 2,
    },
    description: {
        ...common.smallText,
        fontSize: FONT_SIZES.medium,
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.sm,
    },
    articleLink: {
        alignSelf: 'flex-start',
    },
    // The part being recited
    activePart: {
        borderWidth: 2,
        borderColor: theme.primary,
    },
});
