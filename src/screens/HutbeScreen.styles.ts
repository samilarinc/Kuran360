import { StyleSheet } from 'react-native';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        ...common,
        // HutbeScreen is very simple, mostly uses common container
        content: {
            flex: 1,
        },
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
