import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: Theme, isCompact: boolean, isMedium: boolean) => StyleSheet.create({
    audioBar: {
        backgroundColor: theme.primary,
        // CHANGE_HERE: Reduced vertical padding for mobile to save screen space
        paddingVertical: isCompact ? SPACING.xs : (isMedium ? SPACING.sm : SPACING.md), // 4px/8px/16px instead of always 16px
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.primary + '40',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    audioBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        flexWrap: isCompact ? 'wrap' : 'nowrap',
        // CHANGE_HERE: Reduced row and column gaps for more compact layout on mobile
        rowGap: isCompact ? SPACING.xs : 0, // 4px instead of 8px
        columnGap: isCompact ? SPACING.xs : (isMedium ? SPACING.xs : SPACING.sm), // Smaller gaps overall
    },
    audioTextContainer: {
        flex: 1,
        minWidth: 0,
    },
    audioText: {
        color: theme.headerText,
        fontSize: isCompact ? 14 : (isMedium ? 13 : FONT_SIZES.medium),
        fontWeight: '500',
        flex: 1,
        marginRight: SPACING.md,
        minWidth: 0, // allow shrinking with ellipsis
    },
    verseText: {
        color: theme.headerText,
        fontSize: isCompact ? 11 : (isMedium ? 12 : FONT_SIZES.small),
        opacity: 0.9,
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        // CHANGE_HERE: Reduced gaps between control buttons for more compact layout
        gap: isCompact ? SPACING.xs : (isMedium ? SPACING.xs : SPACING.sm), // Smaller gaps
        flexShrink: 0,
        flexWrap: isCompact ? 'wrap' : 'nowrap',
        justifyContent: 'flex-end',
    },
    playModeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    playModeButton: {
        backgroundColor: theme.headerText + '20',
        // CHANGE_HERE: Reduced button sizes for more compact mobile layout
        width: isCompact ? 32 : (isMedium ? 34 : 36), // Smaller buttons on mobile
        height: isCompact ? 32 : (isMedium ? 34 : 36), // Smaller buttons on mobile
        borderRadius: isCompact ? 16 : (isMedium ? 17 : 18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    playModeIcon: {
        fontSize: isCompact ? 14 : (isMedium ? 16 : 16),
        color: theme.headerText,
    },
    playModeLabel: {
        marginTop: 4,
        fontSize: isCompact ? 10 : (isMedium ? 11 : FONT_SIZES.small),
        color: theme.headerText,
        opacity: 0.85,
        textAlign: 'center',
    },
    playPauseButton: {
        backgroundColor: theme.headerText + '20',
        // CHANGE_HERE: Reduced button sizes for more compact mobile layout
        width: isCompact ? 32 : (isMedium ? 34 : 36), // Smaller buttons on mobile
        height: isCompact ? 32 : (isMedium ? 34 : 36), // Smaller buttons on mobile
        borderRadius: isCompact ? 16 : (isMedium ? 17 : 18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseIcon: {
        fontSize: isCompact ? 16 : (isMedium ? 17 : 18),
        color: theme.headerText,
    },
    stopButton: {
        backgroundColor: theme.headerText + '20',
        // CHANGE_HERE: Reduced button sizes for more compact mobile layout
        width: isCompact ? 32 : (isMedium ? 34 : 36), // Smaller buttons on mobile
        height: isCompact ? 32 : (isMedium ? 34 : 36), // Smaller buttons on mobile
        borderRadius: isCompact ? 16 : (isMedium ? 17 : 18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopIcon: {
        fontSize: isCompact ? 16 : (isMedium ? 17 : 18),
        color: theme.headerText,
    },
    playbackRateButton: {
        backgroundColor: theme.headerText + '20',
        // CHANGE_HERE: Reduced padding for more compact mobile layout
        paddingHorizontal: isCompact ? 4 : (isMedium ? 6 : SPACING.sm), // Smaller padding
        paddingVertical: isCompact ? 2 : (isMedium ? 3 : 4), // Smaller padding
        borderRadius: 6,
        minWidth: isCompact ? 32 : 36, // Smaller minimum width
        alignItems: 'center',
    },
    playbackRateText: {
        color: theme.headerText,
        fontSize: isCompact ? 12 : (isMedium ? 13 : FONT_SIZES.small),
        fontWeight: '600',
    },
    audioTrackingContainer: {
        alignItems: 'center',
        gap: 4,
    },
    audioTrackingLabel: {
        color: theme.headerText,
        fontSize: isCompact ? 10 : (isMedium ? 11 : FONT_SIZES.small),
        opacity: 0.8,
        textAlign: 'center',
    },
});
