import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Star } from 'lucide-react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, FAVORITE_COLOR, FAVORITE_COLOR_DARK, Theme } from '@/theme';

interface TranslationListItemProps {
    translationName: string;
    isSelected: boolean;
    isFavorite: boolean;
    isFirst: boolean;
    isLast: boolean;
    onToggleSelected: () => void;
    onToggleFavorite: () => void;
}

export const TranslationListItem: React.FC<TranslationListItemProps> = ({
    translationName,
    isSelected,
    isFavorite,
    isFirst,
    isLast,
    onToggleSelected,
    onToggleFavorite,
}) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <View
            style={[
                styles.translationItem,
                isSelected && styles.selectedTranslationItem,
                isFavorite && styles.favoriteTranslationItem,
                isFirst && styles.firstTranslationItem,
                isLast && styles.lastTranslationItem,
            ]}
        >
            <TouchableOpacity
                style={[common.rowFill, common.gapSm]}
                onPress={onToggleSelected}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.translationText,
                    isSelected && styles.selectedTranslationText,
                    isFavorite && styles.favoriteTranslationText
                ]}>
                    {translationName}
                </Text>
                <View style={[common.checkbox, isSelected && common.selected]}>
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
            </TouchableOpacity>

            {isSelected && (
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={onToggleFavorite}
                    activeOpacity={0.7}
                >
                    <Star
                        size={18}
                        color={isFavorite ? '#FFD700' : theme.border}
                        fill={isFavorite ? '#FFD700' : 'transparent'}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    translationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.xs,
        borderRadius: 12,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
    },
    firstTranslationItem: {
        marginTop: SPACING.xs,
    },
    lastTranslationItem: {
        marginBottom: 0,
    },
    selectedTranslationItem: {
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary,
    },
    favoriteTranslationItem: {
        backgroundColor: FAVORITE_COLOR + '15',
        borderColor: FAVORITE_COLOR,
        borderWidth: 2,
    },
    translationText: {
        flex: 1,
        fontSize: FONT_SIZES.small,
        color: theme.text,
        fontWeight: '500',
    },
    selectedTranslationText: {
        color: theme.primary,
        fontWeight: '600',
    },
    favoriteTranslationText: {
        color: FAVORITE_COLOR_DARK,
        fontWeight: '700',
    },
    favoriteButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
    },
});
