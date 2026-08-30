import { StyleSheet } from 'react-native';
import { Theme } from '@/theme';

export const createStyles = (_theme: Theme) => StyleSheet.create({
    track: {
        width: '100%',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    },
});
