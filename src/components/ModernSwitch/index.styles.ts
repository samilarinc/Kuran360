import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    webSwitch: {
        transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
        marginLeft: SPACING.sm,
    },
    modernSwitchContainer: {
        padding: SPACING.xs,
    },
    modernSwitchTrack: {
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    modernSwitchDisabled: {
        opacity: 0.6,
    },
    modernSwitchThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    modernSwitchThumbActive: {
        backgroundColor: '#FFFFFF',
    },
});
