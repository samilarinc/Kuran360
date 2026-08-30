import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { AppButton } from '@/components/AppButton';
import { TranslationListItem } from '@/components/TranslationListItem';
import { createStyles } from './index.styles';

interface TranslationsSectionProps {
    translations: string[];
    selectedTranslations: string[];
    favoriteTranslation: string;
    onToggleTranslation: (name: string) => void;
    onToggleFavorite: (name: string) => void;
    onSelectAll: () => void;
    onSelectDefault: () => void;
}

export const TranslationsSection: React.FC<TranslationsSectionProps> = ({
    translations,
    selectedTranslations,
    favoriteTranslation,
    onToggleTranslation,
    onToggleFavorite,
    onSelectAll,
    onSelectDefault,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <>
            <View style={styles.translationActions}>
                <AppButton
                    variant="primary"
                    size="small"
                    title={t('settingsScreen.translations.selectAll')}
                    onPress={onSelectAll}
                    style={styles.actionButton}
                />
                <AppButton
                    variant="outline"
                    size="small"
                    title={t('settingsScreen.translations.selectDefault')}
                    onPress={onSelectDefault}
                    style={{ ...styles.actionButton, ...styles.secondaryActionButton }}
                />
            </View>

            <View style={styles.translationsContainer}>
                {translations.map((translation, index) => (
                    <TranslationListItem
                        key={translation}
                        translationName={translation}
                        isSelected={selectedTranslations.includes(translation)}
                        isFavorite={favoriteTranslation === translation}
                        isFirst={index === 0}
                        isLast={index === translations.length - 1}
                        onToggleSelected={() => onToggleTranslation(translation)}
                        onToggleFavorite={() => onToggleFavorite(translation)}
                    />
                ))}
            </View>
        </>
    );
};
