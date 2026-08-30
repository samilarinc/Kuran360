import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

interface ChecklistItemProps {
    checked: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    trailing?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/** A card row with a checkbox on the left, arbitrary label content, and an optional trailing accessory (e.g. delete button). */
export const ChecklistItem: React.FC<ChecklistItemProps> = ({ checked, onToggle, children, trailing, style }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.item, style]}>
            <TouchableOpacity style={styles.content} onPress={onToggle}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                {children}
            </TouchableOpacity>
            {trailing}
        </View>
    );
};
