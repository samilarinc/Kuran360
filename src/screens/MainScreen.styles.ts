import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { MENU_MAX_WIDTH } from '@/components/MenuTileGrid/index.styles';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, _common: CommonStyles) => {

    return StyleSheet.create({
        // Phone-width column, centered on tablets and desktop browsers so the cards don't stretch edge to edge
        contentContainer: {
            width: '100%',
            maxWidth: MENU_MAX_WIDTH,
            alignSelf: 'center',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.xl,
        },
        heroCard: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 18,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
            backgroundColor: theme.featured,
            borderWidth: 1,
            borderColor: theme.featuredBorder,
        },
        heroResume: {
            alignSelf: 'flex-start',
            marginTop: 2,
        },
        // Label quiet, place prominent: the eye goes to the surah and verse first
        heroResumeLabel: {
            fontSize: FONT_SIZES.small,
            color: theme.featuredMuted,
        },
        heroResumePlace: {
            fontSize: FONT_SIZES.medium - 1,
            fontWeight: '600',
            color: theme.featuredText,
        },
        heroIconWrap: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: theme.featuredIconBackground,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        heroTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: '600',
            color: theme.featuredText,
        },
        appLinks: {
            flexDirection: 'row',
            gap: SPACING.sm,
            marginTop: SPACING.sm,
        },
        appLink: {
            flex: 1,
            alignItems: 'center',
            gap: SPACING.xs,
            paddingVertical: SPACING.sm + 4,
            borderRadius: 12,
            backgroundColor: theme.cardBackground,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
        },
        appLinkText: {
            fontSize: FONT_SIZES.small + 2,
            fontWeight: '500',
            color: theme.text,
        },
        footer: {
            alignItems: 'center',
            paddingVertical: SPACING.xl,
            paddingHorizontal: SPACING.lg,
        },
    });
};
