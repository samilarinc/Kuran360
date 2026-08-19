import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        marginVertical: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    sectionDescription: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 20,
    },
    reciterContainer: {
        gap: SPACING.sm,
    },
    reciterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        // 3D effect
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedReciterItem: {
        backgroundColor: theme.primary + '15',
        borderColor: theme.primary,
        borderWidth: 2,
        // Enhanced 3D effect for selected state
        elevation: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    reciterText: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
        fontWeight: '500',
        flex: 1,
    },
    reciterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-between',
    },
    previewButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.sm,
    },
    previewButtonText: {
        fontSize: 16,
    },
    selectedReciterText: {
        color: theme.primary,
        fontWeight: '600',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
    },
    selectedRadioButton: {
        borderColor: theme.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.primary,
    },
});
