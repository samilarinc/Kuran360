import { StyleSheet, Platform } from 'react-native';
import { SPACING, FONT_SIZES } from './index';

// Define a minimal Theme interface if not already exported, 
// or use 'any' if we want to be loose about it for now to avoid circular deps.
// Ideally importing the Theme type from './index' is best.

export const createCommonStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // Cards & Sections
    card: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: SPACING.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: SPACING.md,
    },

    // Typography
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
    },
    text: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    smallText: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
    },

    // Inputs
    input: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        backgroundColor: theme.cardBackground,
        color: theme.text,
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        ...Platform.select({
            web: {
                // @ts-ignore
                position: 'fixed' as any,
                top: 0, left: 0, right: 0, bottom: 0,
            }
        })
    },
    modalContent: {
        backgroundColor: theme.cardBackground,
        borderRadius: 24,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 500,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        marginBottom: SPACING.lg,
        textAlign: 'center',
        color: theme.text,
    },

    // Lists
    listContent: {
        padding: SPACING.lg,
    },
});
