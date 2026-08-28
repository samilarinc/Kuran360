import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
    container: {
        marginVertical: SPACING.md,
    },
    sectionTitle: {
        ...common.title,
    },
    sectionDescription: {
        ...common.smallText,
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
        ...common.card,
        borderRadius: 12,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: theme.border,
        // 3D effect
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
};
