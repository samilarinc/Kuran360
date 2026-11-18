import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

/** Widest a tile menu gets on tablets and desktop browsers */
export const MENU_MAX_WIDTH = 640;

export const createStyles = (theme: Theme) => StyleSheet.create({
    // Phone-width column, centered on wide screens so tiles don't stretch edge to edge
    container: {
        width: '100%',
        maxWidth: MENU_MAX_WIDTH,
        alignSelf: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    tile: {
        // Two per row with a fixed gap: each tile grows from a basis too wide for three
        flexGrow: 1,
        flexBasis: '40%',
        padding: SPACING.sm + 4,
        gap: SPACING.sm,
        borderRadius: 14,
        backgroundColor: theme.cardBackground,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
    },
    // Icon on top: centered with its title
    tileStacked: {
        alignItems: 'center',
    },
    tileInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm + 4,
        paddingVertical: SPACING.md,
    },
    // An odd last tile spans the row instead of leaving a hole
    tileWide: {
        flexBasis: '100%',
    },
    // Among centered stacked tiles, the full-width tile centers its icon and title too
    tileWideCentered: {
        justifyContent: 'center',
    },
    tileIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileTitle: {
        fontSize: FONT_SIZES.medium - 1,
        fontWeight: '500',
        color: theme.text,
    },
    textCentered: {
        textAlign: 'center',
    },
    // Headline tool above the grid: full width, larger icon
    featuredTile: {
        // Sits in a column, not the wrapping row: undo the grid tile's flex sizing, which would set its height here
        flexGrow: 0,
        flexBasis: 'auto',
        marginBottom: SPACING.sm,
        paddingVertical: SPACING.md + 4,
    },
    featuredTileIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
    },
    featuredTileTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
});
