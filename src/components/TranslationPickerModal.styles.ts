import { StyleSheet, Platform, Dimensions } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';
import { Theme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
        overlay: {
            ...common.modalOverlay,
            padding: 0,
        },
        modalContainer: {
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            width: Math.min(screenWidth * 0.9, 420),
            maxHeight: screenHeight * 0.8,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.background,
        },
        title: {
            ...common.title,
            color: theme.primary,
            marginBottom: 0,
        },
        closeButton: {
            padding: SPACING.xs,
            borderRadius: 4,
        },
        closeButtonText: {
            fontSize: FONT_SIZES.large,
            color: theme.textSecondary,
            fontWeight: 'bold',
        },
        searchContainer: {
            padding: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.background,
        },
        searchInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.textSecondary + '40',
            borderRadius: 8,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.sm,
            backgroundColor: theme.background,
        },
        searchInput: {
            flex: 1,
            fontSize: FONT_SIZES.medium,
            color: theme.text,
            paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
        },
        clearButton: {
            padding: SPACING.xs,
        },
        clearButtonText: {
            color: theme.textSecondary,
            fontSize: FONT_SIZES.small,
        },
        optionList: {
            padding: SPACING.sm,
        },
        optionItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.md,
            marginVertical: SPACING.xs,
            borderRadius: 8,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        optionItemSelected: {
            backgroundColor: theme.primary + '10',
            borderColor: theme.primary + '30',
        },
        optionLabel: {
            fontSize: FONT_SIZES.medium,
            color: theme.text,
            flex: 1,
        },
        optionLabelSelected: {
            color: theme.primary,
            fontWeight: '600',
        },
        checkmark: {
            fontSize: FONT_SIZES.medium,
            color: theme.primary,
            fontWeight: 'bold',
            marginLeft: SPACING.sm,
        },
    });
};
