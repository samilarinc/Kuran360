import { StyleSheet } from 'react-native';
import { Theme } from '@/theme';

export const createStyles = (_theme: Theme) => StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    outerBorder: {
        position: 'absolute',
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
        borderWidth: 1,
    },
    innerBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 0.5,
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 35,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    titleLine: {
        height: 1.5,
        marginTop: 15,
    },
    textBlock: {
        width: '100%',
        alignItems: 'center',
    },
    arabicText: {
        textAlign: 'center',
        fontWeight: '600',
        writingDirection: 'rtl',
        // Note: For native, we rely on default system font for Arabic unless linked
    },
    translationText: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 35,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontWeight: '500',
    },
});
