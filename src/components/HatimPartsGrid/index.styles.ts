import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        gridContainer: {
            width: '100%',
            alignSelf: 'center',
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
        },
        partItem: {
            ...common.card,
            aspectRatio: 1,
            borderRadius: 12,
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.xs,
            shadowRadius: 2,
            borderColor: theme.border,
            marginRight: SPACING.md / 2,
            marginLeft: SPACING.md / 2,
        },
        partNumber: {
            fontSize: FONT_SIZES.xlarge,
            fontWeight: '700',
        },
        partClaimant: {
            fontSize: 10,
            marginTop: 4,
        },
        progressBarBackground: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
        },
    });
};
