import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './MenuListRow.styles';

interface MenuListRowProps {
    icon?: string;              // emoji or number string rendered inside the icon circle
    iconColor?: string;         // tint for the icon circle background (e.g. item.color + '15')
    title: string;
    subtitle?: string;
    caption?: string;           // optional extra line, e.g. SurahList's detail line
    variant?: 'card' | 'list';  // 'card' = bordered/shadowed standalone row (UmrahMenuScreen style);
                                 // 'list' = flat row meant to sit inside an existing bordered container (MainScreen style)
    showChevron?: boolean;      // default true
    onPress: () => void;
    testID?: string;
    // Escape hatches for rows whose icon or outer container need to diverge
    // from the variant's defaults (e.g. SurahList's solid numbered circle and
    // its own floating card-style row, distinct from both 'card' and 'list').
    iconStyle?: StyleProp<ViewStyle>;
    iconTextStyle?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    chevronStyle?: StyleProp<TextStyle>;
}

export const MenuListRow: React.FC<MenuListRowProps> = ({
    icon,
    iconColor,
    title,
    subtitle,
    caption,
    variant = 'list',
    showChevron = true,
    onPress,
    testID,
    iconStyle,
    iconTextStyle,
    containerStyle,
    titleStyle,
    chevronStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const isCard = variant === 'card';

    return (
        <TouchableOpacity
            style={[isCard ? styles.cardRow : styles.listRow, containerStyle]}
            onPress={onPress}
            activeOpacity={isCard ? 0.7 : 0.6}
            testID={testID}
        >
            {icon !== undefined && (
                <View
                    style={[
                        isCard ? styles.cardIconContainer : styles.listIconContainer,
                        iconColor ? { backgroundColor: iconColor } : null,
                        iconStyle,
                    ]}
                >
                    <Text style={[isCard ? styles.cardIcon : styles.listIcon, iconTextStyle]}>
                        {icon}
                    </Text>
                </View>
            )}

            <View style={isCard ? styles.cardTextContainer : styles.listTextContainer}>
                <Text style={[isCard ? styles.cardTitle : styles.listTitle, titleStyle]}>
                    {title}
                </Text>
                {subtitle !== undefined && (
                    <Text style={isCard ? styles.cardSubtitle : styles.listSubtitle}>
                        {subtitle}
                    </Text>
                )}
                {caption !== undefined && (
                    <Text style={isCard ? styles.cardSubtitle : styles.listCaption}>
                        {caption}
                    </Text>
                )}
            </View>

            {showChevron && (
                isCard ? (
                    <View style={styles.cardArrowContainer}>
                        <Text style={styles.cardArrow}>›</Text>
                    </View>
                ) : (
                    <Text style={[styles.listChevron, chevronStyle]}>›</Text>
                )
            )}
        </TouchableOpacity>
    );
};
