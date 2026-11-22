import { StyleSheet } from 'react-native';
import { Theme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, RADIUS } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        avatar: { width: 64, height: 64, borderRadius: 32, marginRight: SPACING.md },
        appleButton: { height: 48, width: '100%' },
        // Signed out: a gilded icon, what signing in gives, and the sign-in buttons in a centered column
        signInCard: {
            alignItems: 'center',
            paddingVertical: SPACING.xl,
            paddingHorizontal: SPACING.lg,
        },
        signInIcon: {
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.md,
            backgroundColor: theme.featured,
            borderWidth: 1,
            borderColor: theme.featuredIcon + '66',
        },
        signInTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: '700',
            color: theme.text,
            textAlign: 'center',
        },
        signInText: {
            ...common.smallText,
            maxWidth: 340,
            marginTop: SPACING.xs,
            lineHeight: FONT_SIZES.small * 1.5,
            textAlign: 'center',
        },
        signInButtons: {
            width: '100%',
            maxWidth: 340,
            marginTop: SPACING.lg,
            gap: SPACING.sm,
        },
        // Google's own neutral style: white or dark surface, the four-color G, plain text
        googleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.sm,
            height: 48,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
        },
        googleButtonText: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '600',
            color: theme.text,
        },
        avatarFallback: { backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' },
        avatarInitials: { fontSize: 24, color: theme.primary, fontWeight: '700' },
        name: { fontSize: FONT_SIZES.large, color: theme.text, fontWeight: '600', flex: 1 },
        email: { fontSize: FONT_SIZES.small, color: theme.secondary },
        editNameButton: {
            padding: SPACING.xs,
            marginLeft: SPACING.sm,
            backgroundColor: theme.surface,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme.border,
        },
        nameInput: {
            fontSize: FONT_SIZES.large,
            color: theme.text,
            fontWeight: '600',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: SPACING.sm,
            backgroundColor: theme.surface,
            marginBottom: SPACING.sm,
        },
        editButton: {
            flex: 1,
            paddingVertical: SPACING.xs,
            paddingHorizontal: SPACING.sm,
            borderRadius: 6,
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
        },
        section: {
            ...common.sectionCard,
            marginTop: SPACING.lg,
        },
        listItemSubtitle: {
            ...common.smallText,
            lineHeight: FONT_SIZES.small * 1.4,
        },
        removeButton: {
            padding: SPACING.xs,
            backgroundColor: theme.accent,
            borderRadius: 6,
        },
        timeText: {
            ...common.smallText,
            fontStyle: 'italic',
        },
        emptyText: {
            ...common.emptyStateText,
            paddingVertical: SPACING.lg,
        },
    });
};
