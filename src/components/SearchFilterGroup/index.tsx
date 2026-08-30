import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

interface SearchFilterGroupProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const SearchFilterGroup: React.FC<SearchFilterGroupProps> = ({ title, children, footer }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorTitle}>{title}</Text>
            <View style={styles.selectorGrid}>{children}</View>
            {footer}
        </View>
    );
};
