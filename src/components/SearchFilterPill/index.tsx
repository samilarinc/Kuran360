import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface SearchFilterPillProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon?: LucideIcon;
    trailing?: React.ReactNode;
}

export const SearchFilterPill: React.FC<SearchFilterPillProps> = ({
    label,
    selected,
    onPress,
    icon: Icon,
    trailing,
}) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <TouchableOpacity
            style={[styles.selectorOption, selected && common.selected]}
            onPress={onPress}
        >
            {Icon && (
                <Icon size={14} color={selected ? '#FFFFFF' : theme.text} />
            )}
            <Text style={[styles.selectorOptionText, selected && common.buttonTextPrimary]}>
                {label}
            </Text>
            {trailing}
        </TouchableOpacity>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    selectorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: SPACING.xs,
        minWidth: 80,
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    selectorOptionText: {
        fontSize: FONT_SIZES.small,
        color: theme.text,
        fontWeight: '500',
    },
});
