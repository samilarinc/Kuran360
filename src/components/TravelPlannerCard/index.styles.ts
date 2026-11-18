import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, RADIUS, Theme } from '@/theme';

const DOT = 14;
const RAIL = 22;

export const createStyles = (theme: Theme) => StyleSheet.create({
    card: {
        padding: SPACING.md,
        paddingBottom: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        marginBottom: SPACING.lg,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    // One stop on the route: a rail (dot + connecting line) on the left, the stop's content on the right
    station: {
        flexDirection: 'row',
    },
    rail: {
        width: RAIL,
        alignItems: 'center',
    },
    // Home airports: hollow ring
    dotEndpoint: {
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        borderWidth: 2,
        marginTop: 2,
        borderColor: theme.primary,
        backgroundColor: theme.cardBackground,
    },
    // Mecca / Medina: filled with gilding
    dotHoly: {
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        marginTop: 2,
        backgroundColor: theme.accent,
    },
    // "Then": a small neutral node between the cities
    dotMinor: {
        width: DOT - 6,
        height: DOT - 6,
        borderRadius: (DOT - 6) / 2,
        marginTop: 5,
        backgroundColor: theme.border,
    },
    railLine: {
        flex: 1,
        width: 2,
        marginVertical: 3,
        backgroundColor: theme.border,
    },
    stationBody: {
        flex: 1,
        marginLeft: SPACING.sm,
        paddingBottom: SPACING.lg,
        gap: SPACING.sm,
    },
    stationBodyLast: {
        paddingBottom: 0,
    },
    stationHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    stationLabel: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    nights: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.accent,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    // Tappable value (home city, date): bold value with a thin underline, reads as editable without boxing it
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    fieldGrow: {
        flex: 1,
    },
    fieldText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    fieldPlaceholder: {
        color: theme.textSecondary,
        fontWeight: '400',
    },
    webDateWrapper: {
        position: 'relative',
    },
    segmented: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: RADIUS.md,
        backgroundColor: theme.background,
    },
    segment: {
        flex: 1,
        minHeight: 36,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentActive: {
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
    },
    segmentText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
        color: theme.textSecondary,
    },
    segmentTextActive: {
        color: theme.text,
    },
    note: {
        fontSize: FONT_SIZES.small,
        lineHeight: 18,
        color: theme.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    actionButton: {
        paddingHorizontal: SPACING.md,
        minHeight: 34,
    },
    footer: {
        marginTop: SPACING.lg,
        gap: SPACING.xs,
    },
    flightButton: {
        minHeight: 48,
        borderRadius: RADIUS.md,
    },
    footerHint: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        color: theme.textSecondary,
    },
});
