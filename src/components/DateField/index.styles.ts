import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

// Plain (non-RN) CSS object for the invisible web <input type="date"> overlay.
// Not run through StyleSheet.create since it uses DOM-only CSS properties
// (cursor, outline, appearance) that aren't valid React Native style keys.
export const webDateInputStyle: any = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
    border: 'none',
    outline: 'none',
    // @ts-ignore
    appearance: 'none',
};

export const createStyles = (theme: Theme) => StyleSheet.create({
    compactDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingLeft: SPACING.xs,
    },
    compactDateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.textSecondary,
    },
    compactDateText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
    },
    compactDateTextFilled: {
        color: theme.primary,
    },
    compactDateTextPlaceholder: {
        color: theme.textSecondary,
    },
    webDateInputWrapper: {
        flex: 1,
        position: 'relative',
        height: 35,
        justifyContent: 'center',
    },
});
