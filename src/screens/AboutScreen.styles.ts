import { StyleSheet } from 'react-native';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        container: common.container,
    });
};
