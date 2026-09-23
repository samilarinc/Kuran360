import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface MenuListRowProps {
    icon?: string | React.ReactNode; // emoji/number string, or a custom icon element (e.g. a lucide icon)
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
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);

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
                        isCard ? styles.cardIconContainer : common.iconBox,
                        iconColor ? { backgroundColor: iconColor } : null,
                        iconStyle,
                    ]}
                >
                    {typeof icon === 'string' ? (
                        <Text style={[isCard ? styles.cardIcon : styles.listIcon, iconTextStyle]}>
                            {icon}
                        </Text>
                    ) : (
                        icon
                    )}
                </View>
            )}

            <View style={common.flex1}>
                <Text style={[isCard ? common.title : common.textStrong, titleStyle]}>
                    {title}
                </Text>
                {subtitle !== undefined && (
                    <Text style={isCard ? common.smallText : styles.listSubtitle}>
                        {subtitle}
                    </Text>
                )}
                {caption !== undefined && (
                    <Text style={common.smallText}>
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

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        // Outer row container — card variant (UmrahMenuScreen style)
        cardRow: {
            ...common.card,
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
        },
        // Outer row container — list variant (MainScreen style)
        listRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm + 4,
            paddingHorizontal: SPACING.md,
        },

        // Icon container — card variant
        cardIconContainer: {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        cardIcon: {
            fontSize: 32,
        },
        // Icon container — list variant
        listIcon: {
            fontSize: 18,
        },

        // Text block — card variant

        // Text block — list variant
        listSubtitle: {
            fontSize: FONT_SIZES.large,
            color: theme.primary,
            textAlign: 'right',
            marginBottom: SPACING.xs,
        },

        // Chevron — card variant
        cardArrowContainer: {
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cardArrow: {
            fontSize: 32,
            color: theme.textSecondary,
        },
        // Chevron — list variant
        listChevron: {
            fontSize: FONT_SIZES.large,
            fontWeight: '300',
            marginLeft: SPACING.sm,
            color: theme.textSecondary,
        },
    });
};
