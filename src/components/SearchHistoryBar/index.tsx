import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

interface SearchHistoryBarProps {
    visible: boolean;
    history: string[];
    onSelect: (query: string) => void;
    onClear: () => void;
}

export const SearchHistoryBar: React.FC<SearchHistoryBarProps> = ({ visible, history, onSelect, onClear }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (!visible || history.length === 0) return null;

    return (
        <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>{t('searchScreen.history.title')}</Text>
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
