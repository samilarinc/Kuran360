import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

interface SearchFilterDropdownProps {
    children: React.ReactNode;
}

export const SearchFilterDropdown: React.FC<SearchFilterDropdownProps> = ({ children }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.surahDropdown}>
            <ScrollView
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.selectorGrid}>{children}</View>
            </ScrollView>
        </View>
    );
};
