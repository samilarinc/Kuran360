import { StyleSheet } from 'react-native';
import { FONT_SIZES, RADIUS, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { TRANSLATION_FONT_FAMILY } from '@/constants/fonts';

// The list reads like an index page: one column, kept to a comfortable width on tablets and web
export const LIST_MAX_WIDTH = 640;
const NUMBER_SIZE = 34;
const SHEET_ARABIC_SIZE = 56;
// Between FONT_SIZES.small (12) and medium (16): secondary lines that still read comfortably
const BODY_SMALL = 14;

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    listContent: {
        width: '100%',
        maxWidth: LIST_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl * 2,
    },
    listHeader: {
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    intro: {
        ...common.smallText,
        fontSize: BODY_SMALL,
        lineHeight: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
    },
    // The names' sequence number in a thin gilded ring
    number: {
        width: NUMBER_SIZE,
        height: NUMBER_SIZE,
        borderRadius: NUMBER_SIZE / 2,
        borderWidth: 1,
        borderColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.accent,
        fontVariant: ['tabular-nums'],
    },
    rowText: {
        flex: 1,
        gap: 2,
    },
    rowName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    rowMeaning: {
        fontSize: BODY_SMALL,
        color: theme.textSecondary,
    },
    rowArabic: {
        fontSize: 26,
        lineHeight: 42,
        color: theme.primary,
        textAlign: 'right',
        writingDirection: 'rtl',
        maxWidth: '42%',
    },

    // Detail sheet: the screen's one bold block, deep green with the name in gold
    sheetBackdrop: {
        ...common.modalOverlayBottom,
        alignItems: 'center',
    },
    sheetDismiss: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        width: '100%',
        maxWidth: LIST_MAX_WIDTH,
        backgroundColor: theme.featured,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: theme.featuredBorder,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    sheetTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sheetCounter: {
        fontSize: FONT_SIZES.small,
        color: theme.featuredMuted,
        fontVariant: ['tabular-nums'],
    },
    sheetIconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    sheetArabic: {
        fontSize: SHEET_ARABIC_SIZE,
        lineHeight: SHEET_ARABIC_SIZE * 1.7,
        color: theme.featuredIcon,
        textAlign: 'center',
        writingDirection: 'rtl',
        marginTop: SPACING.sm,
    },
    sheetName: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
        color: theme.featuredText,
        textAlign: 'center',
    },
    sheetRule: {
        alignSelf: 'center',
        width: 48,
        height: 1,
        backgroundColor: theme.featuredIcon,
        opacity: 0.6,
        marginVertical: SPACING.lg,
    },
    sheetMeaning: {
        fontFamily: TRANSLATION_FONT_FAMILY,
        fontSize: FONT_SIZES.translation + 1,
        lineHeight: (FONT_SIZES.translation + 1) * 1.6,
        color: theme.featuredText,
        textAlign: 'center',
        minHeight: (FONT_SIZES.translation + 1) * 1.6 * 2,
    },
    sheetNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.xl,
        gap: SPACING.md,
    },
    sheetNavButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm + 2,
        borderRadius: RADIUS.md,
        backgroundColor: theme.featuredIconBackground,
    },
    sheetNavText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.featuredText,
    },
});
