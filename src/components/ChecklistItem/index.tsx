import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ChecklistItemProps {
    checked: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    trailing?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/** A card row with a checkbox on the left, arbitrary label content, and an optional trailing accessory (e.g. delete button). */
export const ChecklistItem: React.FC<ChecklistItemProps> = ({ checked, onToggle, children, trailing, style }) => {
    const { common } = useTheme();

    return (
        <View style={[common.listItem, style]}>
            <TouchableOpacity style={[common.rowFill, common.gapMd]} onPress={onToggle}>
                <View style={[common.checkbox, checked && common.selected]}>
                    {checked && <Text style={common.checkmark}>✓</Text>}
                </View>
                {children}
            </TouchableOpacity>
            {trailing}
        </View>
    );
};
