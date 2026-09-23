import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles, useTheme } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';

interface SearchFilterDropdownProps {
    children: React.ReactNode;
}

export const SearchFilterDropdown: React.FC<SearchFilterDropdownProps> = ({ children }) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={styles.surahDropdown}>
            <ScrollView
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
            >
                <View style={common.rowWrap}>{children}</View>
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    surahDropdown: {
        backgroundColor: theme.cardBackground,
        borderRadius: 8,
        marginTop: SPACING.xs,
        borderWidth: 1,
        borderColor: theme.border,
        padding: SPACING.xs,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
});
