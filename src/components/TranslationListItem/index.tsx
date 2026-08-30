import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

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
                style={styles.translationMainContent}
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
                <View style={[styles.modernCheckbox, isSelected && styles.modernCheckboxSelected]}>
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
