import { StyleSheet } from 'react-native';
import { Theme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        avatar: { width: 64, height: 64, borderRadius: 32, marginRight: SPACING.md },
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
