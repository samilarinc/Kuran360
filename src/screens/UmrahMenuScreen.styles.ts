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
    header: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        color: theme.text,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.medium,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderRadius: 16,
        marginBottom: SPACING.md,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    icon: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        color: theme.text,
    },
    description: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
    },
    arrowContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 32,
        color: theme.textSecondary,
    },
    footer: {
        marginTop: SPACING.xl,
        padding: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    footerText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        color: theme.textSecondary,
    },
});
