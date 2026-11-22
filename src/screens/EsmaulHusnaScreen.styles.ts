import { StyleSheet } from 'react-native';
import { FONT_SIZES, RADIUS, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { TRANSLATION_FONT_FAMILY } from '@/constants/fonts';

// Content is kept to a comfortable width on tablets and web
export const CONTENT_MAX_WIDTH = 720;
export const GRID_GAP = SPACING.sm;
// Between FONT_SIZES.small (12) and medium (16): secondary lines that still read comfortably
const BODY_SMALL = 14;
const PLAQUE_ARABIC = 76;
const NAV_BUTTON = 48;

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    // ----- Tabs -----
    tabsWrap: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
    },
    tabs: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: RADIUS.pill,
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.pill,
        alignItems: 'center',
    },
    tabSelected: {
        backgroundColor: theme.primary,
    },
    tabText: {
        fontSize: BODY_SMALL,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    tabTextSelected: {
        color: theme.headerText,
    },

    // ----- Shared list chrome -----
    listContent: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl * 2,
    },
    listHeader: {
        paddingTop: SPACING.md,
        paddingBottom: SPACING.md,
        gap: SPACING.md,
    },
    footer: {
        ...common.footerText,
        marginTop: SPACING.lg,
    },

    // ----- Name of the day: a small plaque, the list's one bold block -----
    dayPlaque: {
        backgroundColor: theme.featured,
        borderRadius: RADIUS.lg,
        padding: 6,
        borderWidth: 1,
        borderColor: theme.featuredBorder,
    },
    // Hairline gold frame inset in the green, as on a calligraphy panel
    frame: {
        borderWidth: 1,
        borderColor: theme.featuredIcon + '66',
        borderRadius: RADIUS.md,
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.xs,
    },
    dayLabel: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.featuredMuted,
    },
    dayArabic: {
        fontSize: 44,
        lineHeight: 80,
        color: theme.featuredIcon,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    dayName: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        color: theme.featuredText,
        textAlign: 'center',
    },
    dayMeaning: {
        fontFamily: TRANSLATION_FONT_FAMILY,
        fontSize: BODY_SMALL + 1,
        lineHeight: (BODY_SMALL + 1) * 1.55,
        color: theme.featuredMuted,
        textAlign: 'center',
        maxWidth: 420,
    },

    // ----- Names grid -----
    gridRow: {
        gap: GRID_GAP,
        marginBottom: GRID_GAP,
    },
    tile: {
        backgroundColor: theme.cardBackground,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: theme.border,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.xs,
        alignItems: 'center',
    },
    tileNumber: {
        alignSelf: 'flex-start',
        marginLeft: SPACING.xs,
        fontSize: 11,
        fontWeight: '600',
        color: theme.accent,
        fontVariant: ['tabular-nums'],
    },
    tileArabic: {
        fontSize: 24,
        lineHeight: 46,
        color: theme.primary,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    tileName: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.textSecondary,
        textAlign: 'center',
    },

    // ----- Attributes -----
    intro: {
        fontSize: BODY_SMALL,
        lineHeight: 21,
        color: theme.textSecondary,
    },
    groupTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '700',
        color: theme.text,
        marginTop: SPACING.lg,
        marginLeft: SPACING.xs,
    },
    groupDescription: {
        fontSize: BODY_SMALL,
        lineHeight: 20,
        color: theme.textSecondary,
        marginTop: 2,
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
        padding: SPACING.md,
    },
    rowDivider: {
        ...common.divider,
        marginLeft: SPACING.md,
    },
    rowText: {
        flex: 1,
        gap: 3,
    },
    rowName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    rowMeaning: {
        fontSize: BODY_SMALL,
        lineHeight: 20,
        color: theme.textSecondary,
    },
    rowVerse: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.accent,
    },
    rowArabic: {
        fontSize: 22,
        lineHeight: 42,
        color: theme.primary,
        textAlign: 'right',
        writingDirection: 'rtl',
        maxWidth: '40%',
    },

    // ----- Full-screen plaque viewer -----
    viewer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        backgroundColor: theme.featured,
    },
    viewerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    viewerCaption: {
        fontSize: BODY_SMALL,
        color: theme.featuredMuted,
        fontVariant: ['tabular-nums'],
        marginLeft: SPACING.sm,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    page: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    pageFrame: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: theme.featuredIcon + '55',
        borderRadius: RADIUS.lg,
        padding: 6,
    },
    pageFrameInner: {
        borderWidth: 1,
        borderColor: theme.featuredIcon + '30',
        borderRadius: RADIUS.md,
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.lg,
    },
    pageArabic: {
        fontSize: PLAQUE_ARABIC,
        lineHeight: PLAQUE_ARABIC * 1.75,
        color: theme.featuredIcon,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    pageArabicLong: {
        fontSize: PLAQUE_ARABIC * 0.6,
        lineHeight: PLAQUE_ARABIC * 0.6 * 1.9,
    },
    pageTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
        color: theme.featuredText,
        textAlign: 'center',
    },
    pageRule: {
        width: 40,
        height: 1,
        backgroundColor: theme.featuredIcon,
        opacity: 0.6,
        marginVertical: SPACING.lg,
    },
    pageBody: {
        fontFamily: TRANSLATION_FONT_FAMILY,
        fontSize: FONT_SIZES.translation + 1,
        lineHeight: (FONT_SIZES.translation + 1) * 1.65,
        color: theme.featuredText,
        textAlign: 'center',
    },
    verseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.pill,
        backgroundColor: theme.featuredIconBackground,
    },
    verseButtonText: {
        fontSize: BODY_SMALL,
        fontWeight: '600',
        color: theme.featuredText,
    },
    viewerBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
    },
    navButton: {
        width: NAV_BUTTON,
        height: NAV_BUTTON,
        borderRadius: NAV_BUTTON / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.featuredIconBackground,
    },
    navHint: {
        fontSize: FONT_SIZES.small,
        color: theme.featuredMuted,
    },
});
