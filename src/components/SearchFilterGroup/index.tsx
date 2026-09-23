import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CommonStyles, useThemedStyles, useTheme } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';

interface SearchFilterGroupProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const SearchFilterGroup: React.FC<SearchFilterGroupProps> = ({ title, children, footer }) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={common.mbMd}>
            <Text style={styles.selectorTitle}>{title}</Text>
            <View style={common.rowWrap}>{children}</View>
            {footer}
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        selectorTitle: {
            ...common.sectionLabel,
            color: theme.secondary,
            marginBottom: SPACING.xs,
            textTransform: 'uppercase',
        },
    });
};
