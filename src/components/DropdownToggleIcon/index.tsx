import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

interface DropdownToggleIconProps {
    expanded: boolean;
}

export const DropdownToggleIcon: React.FC<DropdownToggleIconProps> = ({ expanded }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return <Text style={styles.toggleIcon}>{expanded ? '▲' : '▼'}</Text>;
};
