import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DropdownToggleIconProps {
    expanded: boolean;
}

export const DropdownToggleIcon: React.FC<DropdownToggleIconProps> = ({ expanded }) => {
    const { theme, common } = useTheme();

    return <Text style={[common.badgeText, { color: theme.secondary }]}>{expanded ? '▲' : '▼'}</Text>;
};
