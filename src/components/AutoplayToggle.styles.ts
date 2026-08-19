import { StyleSheet } from 'react-native';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        width: 60,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    knob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    knobWhite: {
        backgroundColor: '#FFFFFF',
    },
    icon: {
        fontSize: 12,
        textAlign: 'center',
    },
});
