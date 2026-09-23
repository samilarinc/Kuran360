import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { ImageSize } from '@/types';
import { IMAGE_SIZES } from '@/utils/imageSizes';
import { FONT_SIZES, SPACING, RADIUS, Theme } from '@/theme';
import { PlatformIcon } from '../PlatformIcon';

interface ImageSizePickerProps {
    selected: ImageSize;
    onSelect: (size: ImageSize) => void;
    disabled?: boolean;
    showDimensions?: boolean;
}

/** Horizontal list of share-image sizes (ShareModal, ImagePreviewModal). */
export const ImageSizePicker: React.FC<ImageSizePickerProps> = ({ selected, onSelect, disabled, showDimensions }) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} nestedScrollEnabled>
            <View style={[common.rowGap, styles.row]}>
                {IMAGE_SIZES.map((size) => {
                    const isSelected = selected.id === size.id;
                    const onPrimary = isSelected && common.buttonTextPrimary;
                    return (
                        <TouchableOpacity
                            key={size.id}
                            style={[styles.button, isSelected && common.buttonPrimary]}
                            onPress={() => onSelect(size)}
                            disabled={disabled}
                        >
                            <View style={common.mbXs}>
                                <PlatformIcon spec={size.icon} size={20} color={isSelected ? '#fff' : theme.text} />
                            </View>
                            <Text style={[styles.title, onPrimary]}>{size.displayName}</Text>
                            <Text style={[styles.caption, onPrimary]}>{size.description}</Text>
                            {showDimensions && (
                                <Text style={[styles.caption, styles.dimensions, onPrimary]}>
                                    {size.width}×{size.height}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    scroll: {
        marginVertical: SPACING.sm,
    },
    row: {
        alignItems: 'stretch',
        paddingHorizontal: SPACING.sm,
    },
    button: {
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        minWidth: 110,
        maxWidth: 130,
        backgroundColor: theme.cardBackground,
    },
    title: {
        ...common.badgeText,
        color: theme.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    caption: {
        fontSize: FONT_SIZES.small - 2,
        lineHeight: 14,
        textAlign: 'center',
        color: theme.textSecondary,
    },
    dimensions: {
        marginTop: SPACING.xs,
        fontFamily: 'monospace',
    },
});
