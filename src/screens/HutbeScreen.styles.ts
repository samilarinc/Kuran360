import { StyleSheet } from 'react-native';
import { createCommonStyles } from '@/theme/common.styles';
import { Theme } from '@/theme';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        mobileContainer: {
            ...common.container,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        mobileText: {
            ...common.text,
            textAlign: 'center',
            marginVertical: 20,
            fontSize: 18,
        },
    });
};
