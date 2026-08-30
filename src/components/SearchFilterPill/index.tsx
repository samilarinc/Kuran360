import React, { useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <TouchableOpacity
            style={[styles.selectorOption, selected && styles.selectorOptionSelected]}
            onPress={onPress}
        >
            {Icon && (
                <Icon size={14} color={selected ? '#FFFFFF' : theme.text} style={styles.selectorIcon} />
            )}
            <Text style={[styles.selectorOptionText, selected && styles.selectorOptionTextSelected]}>
                {label}
            </Text>
            {trailing}
        </TouchableOpacity>
    );
};
