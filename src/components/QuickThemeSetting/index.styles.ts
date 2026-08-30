import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        quickSettingsSection: {
            ...common.card,
            padding: 0,
            marginTop: SPACING.md,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
        },
        quickSettingsTitle: {
            ...common.sectionLabel,
            color: theme.secondary,
            textTransform: 'uppercase',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.xs,
        },
    });
};
