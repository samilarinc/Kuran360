import { StyleSheet, Platform, Dimensions } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';
import { Theme } from '../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const createStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        width: Math.min(screenWidth * 0.9, 400),
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
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.primary,
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
    searchLabel: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        marginBottom: SPACING.xs,
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
    verseList: {
        flex: 1,
        padding: SPACING.sm,
    },
    verseItem: {
        padding: SPACING.md,
        marginVertical: SPACING.xs,
        borderRadius: 8,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currentVerseItem: {
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary + '30',
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    verseNumber: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.primary,
    },
    currentVerseNumber: {
        color: theme.primary,
        fontWeight: 'bold',
    },
    currentLabel: {
        fontSize: FONT_SIZES.small,
        color: theme.primary,
        fontWeight: '500',
        backgroundColor: theme.primary + '20',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    versePreview: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    currentVersePreview: {
        color: theme.text,
    },
    quickNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: theme.background,
    },
    quickNavButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: theme.primary + '20',
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
    },
    quickNavText: {
        fontSize: FONT_SIZES.small,
        color: theme.primary,
        fontWeight: '500',
    },
});
