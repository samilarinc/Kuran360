import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

const BUTTON_SIZE = 36;
const PLAY_BUTTON_SIZE = 44;

export const createStyles = (theme: Theme) => StyleSheet.create({
    audioBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        width: '100%',
        backgroundColor: theme.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        ...SHADOW.md,
    },
    info: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        minHeight: PLAY_BUTTON_SIZE,
    },
    title: {
        color: theme.headerText,
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    status: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        opacity: 0.8,
    },
    hint: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    iconButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: theme.headerText + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconOff: {
        opacity: 0.5,
    },
    rateButton: {
        minWidth: BUTTON_SIZE + 4,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        paddingHorizontal: SPACING.xs,
        backgroundColor: theme.headerText + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '700',
    },
    playButton: {
        width: PLAY_BUTTON_SIZE,
        height: PLAY_BUTTON_SIZE,
        borderRadius: PLAY_BUTTON_SIZE / 2,
        backgroundColor: theme.headerText,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
