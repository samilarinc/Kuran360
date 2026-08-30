import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        section: {
            ...common.card,
            padding: 0,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SPACING.lg,
            backgroundColor: theme.primary + '08',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        sectionHeaderContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        sectionIconWrap: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        sectionTitle: {
            ...common.text,
            fontWeight: '600',
            marginBottom: 2,
        },
        sectionSubtitle: {
            ...common.smallText,
            color: theme.secondary,
        },
        expandButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.border + '30',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: SPACING.md,
        },
        expandButtonActive: {
            backgroundColor: theme.primary + '20',
        },
        sectionContent: {
            backgroundColor: theme.cardBackground,
        },
    });
};
