import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { AppButton } from '@/components/AppButton';
import { TranslationListItem } from '@/components/TranslationListItem';
import { SPACING, Theme } from '@/theme';

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
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

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
                    style={styles.actionButton}
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

const createStyles = (_theme: Theme) => StyleSheet.create({
    translationActions: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
    },
    translationsContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
});
