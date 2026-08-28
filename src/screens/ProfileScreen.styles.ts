import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme as any);

    return StyleSheet.create({
        ...common,
        content: { padding: SPACING.lg },
        card: {
            ...common.infoCard,
            borderRadius: 12,
        },
        avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
        avatar: { width: 64, height: 64, borderRadius: 32, marginRight: SPACING.md },
        avatarFallback: { backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' },
        avatarInitials: { fontSize: 24, color: theme.primary, fontWeight: '700' },
        nameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
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
        editNameButtonText: {
            fontSize: 14,
        },
        editNameContainer: {
            flex: 1,
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
        editButtonRow: {
            flexDirection: 'row',
            gap: SPACING.sm,
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
        cancelButtonText: {
            color: theme.textSecondary,
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
        },
        saveButton: {
            backgroundColor: theme.primary,
        },
        saveButtonText: {
            color: '#fff',
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
        },
        section: {
            ...common.infoCard,
            borderRadius: 12,
            marginTop: SPACING.lg,
        },
        sectionTitle: {
            ...common.title,
            fontWeight: '600',
            marginBottom: SPACING.md,
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.sm,
            backgroundColor: theme.surface,
            borderRadius: 8,
            marginBottom: SPACING.sm,
            borderWidth: 1,
            borderColor: theme.border,
        },
        listItemContent: {
            flex: 1,
            marginRight: SPACING.sm,
        },
        listItemTitle: {
            ...common.text,
            fontWeight: '600',
            marginBottom: 4,
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
        removeButtonText: {
            fontSize: 16,
        },
        timeText: {
            ...common.smallText,
            fontStyle: 'italic',
        },
        emptyText: {
            ...common.emptyStateText,
            paddingVertical: SPACING.lg,
        },
        nameFlex: {
            flex: 1,
        },
        notSignedInText: {
            marginBottom: SPACING.md,
        },
    });
};
