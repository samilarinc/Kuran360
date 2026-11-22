import { StyleSheet } from 'react-native';
import { FONT_SIZES, RADIUS, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { TRANSLATION_FONT_FAMILY } from '@/constants/fonts';

// Counter: the gilded ring is drawn TAP_RING wide, the green bead inside leaves a gap of RING_GAP
export const TAP_RING = 216;
export const RING_STROKE = 6;
const RING_GAP = 10;
const TAP_SIZE = TAP_RING - 2 * (RING_STROKE + RING_GAP);
const SIDE_BUTTON = 44;
const CONTENT_MAX_WIDTH = 640;
// Between FONT_SIZES.small (12) and medium (16): secondary lines that still read comfortably
const BODY_SMALL = 14;

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    // ----- List -----
    listContent: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        padding: SPACING.lg,
        paddingBottom: SPACING.xl * 2,
    },
    // The free counter: the list's one bold block
    featured: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.lg,
        borderRadius: RADIUS.lg,
        backgroundColor: theme.featured,
        borderWidth: 1,
        borderColor: theme.featuredBorder,
    },
    featuredIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.featuredIconBackground,
    },
    featuredText: {
        flex: 1,
        gap: 2,
    },
    featuredTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        color: theme.featuredText,
    },
    featuredSubtitle: {
        fontSize: BODY_SMALL,
        color: theme.featuredMuted,
    },
    featuredCount: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.featuredIcon,
        fontVariant: ['tabular-nums'],
    },
    sectionTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '700',
        color: theme.text,
        marginTop: SPACING.xl,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    group: {
        backgroundColor: theme.cardBackground,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
    },
    rowDivider: {
        ...common.divider,
        marginLeft: SPACING.md,
    },
    rowText: {
        flex: 1,
        gap: 2,
    },
    rowTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    rowSubtitle: {
        fontSize: BODY_SMALL,
        color: theme.textSecondary,
    },
    rowCount: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.accent,
        fontVariant: ['tabular-nums'],
    },
    rowPercent: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.accent,
    },
    addRowTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.primary,
    },
    formContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl * 2,
    },

    // ----- Counter -----
    counterContainer: {
        ...common.flex1,
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.lg,
        gap: SPACING.md,
    },
    topRow: {
        ...common.rowBetween,
        gap: SPACING.md,
        minHeight: 32,
    },
    textModeRow: {
        ...common.row,
        gap: SPACING.sm,
        marginLeft: 'auto',
    },
    stepCaption: {
        fontSize: BODY_SMALL,
        color: theme.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    // One thin segment per step: done ones gilded, the current one ink green
    segments: {
        flexDirection: 'row',
        gap: 3,
    },
    segment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.border,
    },
    segmentDone: {
        backgroundColor: theme.accent,
    },
    segmentCurrent: {
        backgroundColor: theme.primary,
    },
    textScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
    },
    arabic: {
        fontSize: 34,
        lineHeight: 64,
        textAlign: 'center',
        color: theme.primary,
        writingDirection: 'rtl',
    },
    transliteration: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
    },
    meaning: {
        fontFamily: TRANSLATION_FONT_FAMILY,
        fontSize: FONT_SIZES.translation,
        lineHeight: FONT_SIZES.translation * 1.6,
        color: theme.textSecondary,
        textAlign: 'center',
        maxWidth: 460,
    },
    note: {
        ...common.textAccent,
        fontSize: BODY_SMALL,
        textAlign: 'center',
    },
    placeholder: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    controls: {
        alignItems: 'center',
        gap: SPACING.md,
    },
    tapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    sideButton: {
        width: SIDE_BUTTON,
        height: SIDE_BUTTON,
        borderRadius: SIDE_BUTTON / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.cardBackground,
    },
    sideButtonPlaceholder: {
        width: SIDE_BUTTON,
    },
    tapButton: {
        width: TAP_SIZE,
        height: TAP_SIZE,
        borderRadius: TAP_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.featured,
        borderWidth: 1,
        borderColor: theme.featuredBorder,
    },
    tapCount: {
        fontSize: 60,
        fontWeight: '700',
        color: theme.featuredText,
        fontVariant: ['tabular-nums'],
    },
    tapTarget: {
        fontSize: FONT_SIZES.medium,
        color: theme.featuredMuted,
        fontVariant: ['tabular-nums'],
    },
    actionRow: {
        ...common.row,
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'center',
    },
    buttonRow: {
        ...common.row,
        gap: SPACING.sm,
        alignSelf: 'stretch',
        justifyContent: 'center',
    },
    lockedText: {
        ...common.smallText,
        textAlign: 'center',
    },
    doneBlock: {
        alignSelf: 'stretch',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    doneTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        color: theme.text,
    },
    doneText: {
        fontSize: BODY_SMALL,
        color: theme.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
});
