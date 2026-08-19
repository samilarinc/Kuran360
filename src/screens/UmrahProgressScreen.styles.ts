import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    progressCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    icon: {
        fontSize: FONT_SIZES.xlarge,
        marginRight: SPACING.sm,
    },
    largeIcon: {
        fontSize: 48,
    },
    progressTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        color: theme.text,
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
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    adjustButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    adjustButtonText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.text,
    },
    ihramCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
    resetButton: {
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    duaLink: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    duaLinkCenter: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.xs,
        alignItems: 'center',
    },
    duaLinkText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.primary,
    },
});
