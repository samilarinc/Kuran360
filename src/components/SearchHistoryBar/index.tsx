import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles, useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface SearchHistoryBarProps {
    visible: boolean;
    history: string[];
    onSelect: (query: string) => void;
    onClear: () => void;
}

export const SearchHistoryBar: React.FC<SearchHistoryBarProps> = ({ visible, history, onSelect, onClear }) => {
    const { common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

    if (!visible || history.length === 0) return null;

    return (
        <View style={[common.sectionCardCompact, common.mbLg]}>
            <View style={[common.rowBetween, common.mbSm]}>
                <Text style={common.textStrong}>{t('searchScreen.history.title')}</Text>
                <TouchableOpacity onPress={onClear}>
                    <Text style={styles.clearHistoryText}>{t('searchScreen.history.clear')}</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {history.map((historyItem, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.historyItem}
                        onPress={() => onSelect(historyItem)}
                    >
                        <Text style={styles.historyItemText}>
                            {historyItem}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: Theme) => {

    return StyleSheet.create({
        clearHistoryText: {
            fontSize: FONT_SIZES.small,
            color: theme.primary,
            fontWeight: '500',
        },
        historyItem: {
            backgroundColor: theme.background,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            borderRadius: 20,
            marginRight: SPACING.xs,
            borderWidth: 1,
            borderColor: theme.border,
        },
        historyItemText: {
            fontSize: FONT_SIZES.small,
            color: theme.text,
        },
    });
};
