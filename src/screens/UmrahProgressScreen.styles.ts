import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { shadow } from '@msarinc/ui';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
    progressCard: {
        ...common.card,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        alignItems: 'center',
        ...shadow({ opacity: 0.1, radius: 4, offset: { width: 0, height: 2 }, elevation: 3 }),
    },
    icon: {
        fontSize: 48,
        marginRight: SPACING.sm,
    },
    progressCount: {
        fontSize: 64,
        fontWeight: 'bold',
        marginVertical: SPACING.lg,
        color: theme.primary,
    },
    directionText: {
        fontSize: FONT_SIZES.large,
        marginBottom: SPACING.sm,
        color: theme.textSecondary,
    },
    adjustButton: {
        borderWidth: 2,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    adjustButtonText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.text,
    },
    ihramCard: {
        ...common.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        ...shadow({ opacity: 0.1, radius: 4, offset: { width: 0, height: 2 }, elevation: 3 }),
        borderColor: theme.border,
    },
    ihramCardActive: {
        backgroundColor: theme.primary,
    },
    ihramCardInactive: {
        backgroundColor: theme.surface,
    },
    ihramText: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginLeft: SPACING.md,
    },
    ihramTextActive: {
        color: '#FFFFFF',
    },
    ihramTextInactive: {
        color: theme.text,
    },
    duaLink: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    });
};
