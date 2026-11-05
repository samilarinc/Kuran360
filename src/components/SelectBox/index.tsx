import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, ScrollView, StyleProp, ViewStyle, StyleSheet, useWindowDimensions } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { SHADOW } from '@msarinc/ui';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADIUS, SPACING, Theme } from '@/theme';

export interface SelectBoxOption<T extends string> {
    value: T;
    label: string;
}

interface SelectBoxProps<T extends string> {
    options: SelectBoxOption<T>[];
    value: T;
    onChange: (value: T) => void;
    style?: StyleProp<ViewStyle>;
}

type Anchor = { x: number; y: number; width: number };

const MENU_GAP = 4;

/**
 * A field showing the chosen option. Tapping it floats the options in a menu right below it, over the page, so
 * nothing below moves; tapping outside closes it.
 */
export const SelectBox = <T extends string>({ options, value, onChange, style }: SelectBoxProps<T>) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { height: windowHeight } = useWindowDimensions();
    const fieldRef = useRef<View>(null);
    const [anchor, setAnchor] = useState<Anchor | null>(null);
    const selected = options.find(option => option.value === value);

    const open = () =>
        fieldRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y: y + height + MENU_GAP, width }));
    const close = () => setAnchor(null);

    return (
        <View style={style}>
            <TouchableOpacity ref={fieldRef} style={styles.field} onPress={open} activeOpacity={0.7}>
                <Text style={[styles.fieldText, common.flex1]} numberOfLines={1}>
                    {selected?.label ?? ''}
                </Text>
                <ChevronDown size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <Modal visible={!!anchor} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={StyleSheet.absoluteFill} onPress={close} />
                {anchor && (
                    <View style={[styles.menu, { top: anchor.y, left: anchor.x, width: anchor.width, maxHeight: windowHeight - anchor.y - SPACING.lg }]}>
                        <ScrollView bounces={false}>
                            {options.map(option => {
                                const isSelected = option.value === value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.option, isSelected && styles.optionSelected]}
                                        onPress={() => {
                                            close();
                                            if (!isSelected) onChange(option.value);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]} numberOfLines={1}>
                                            {option.label}
                                        </Text>
                                        {isSelected && <Check size={16} color={theme.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    fieldText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    menu: {
        position: 'absolute',
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: RADIUS.sm,
        paddingVertical: SPACING.xs,
        overflow: 'hidden',
        ...SHADOW.md,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    optionSelected: {
        backgroundColor: theme.primary + '12',
    },
    optionText: {
        flex: 1,
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    optionTextSelected: {
        color: theme.primary,
        fontWeight: '600',
    },
});
