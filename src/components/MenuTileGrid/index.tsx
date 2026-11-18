import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { createStyles, MENU_MAX_WIDTH } from './index.styles';

export interface MenuTile {
    id: string;
    title: string;
    Icon: LucideIcon;
    /** Icon color; its tile background is a light tint of it */
    color: string;
    onPress: () => void;
    /** A headline tool: shown full width above the grid, with a larger icon */
    featured?: boolean;
}

interface MenuTileGridProps {
    items: MenuTile[];
}

// Screen width from which tiles put the icon beside the title (each tile is then ~200px wide)
const INLINE_TILES_MIN_WIDTH = 460;

/**
 * Menu as a two-column grid of tiles (main menu and its submenus).
 * Featured items come first at full width; an odd last tile spans the row.
 */
export const MenuTileGrid: React.FC<MenuTileGridProps> = ({ items }) => {
    const styles = useThemedStyles(createStyles);
    const { width: windowWidth } = useWindowDimensions();
    // Icon beside the title once a tile is wide enough to keep titles on one line; on phones the icon sits on top
    const inline = Math.min(windowWidth, MENU_MAX_WIDTH) >= INLINE_TILES_MIN_WIDTH;

    const featured = items.filter(item => item.featured);
    const gridItems = items.filter(item => !item.featured);

    return (
        <View style={styles.container}>
            {featured.map(item => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.tile, styles.tileInline, styles.featuredTile]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                >
                    <View style={[styles.tileIcon, styles.featuredTileIcon, { backgroundColor: item.color + '1F' }]}>
                        <item.Icon size={22} color={item.color} />
                    </View>
                    <Text style={styles.featuredTileTitle}>{item.title}</Text>
                </TouchableOpacity>
            ))}
            <View style={styles.grid}>
                {gridItems.map((item, index) => {
                    const wide = gridItems.length % 2 === 1 && index === gridItems.length - 1;
                    const rowLayout = inline || wide;
                    // Title centers under a stacked icon
                    const centerText = !rowLayout;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.tile,
                                rowLayout ? styles.tileInline : styles.tileStacked,
                                wide && styles.tileWide,
                                wide && !inline && styles.tileWideCentered,
                            ]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                        >
                            <View style={[styles.tileIcon, { backgroundColor: item.color + '1F' }]}>
                                <item.Icon size={18} color={item.color} />
                            </View>
                            <Text style={[styles.tileTitle, centerText && styles.textCentered]}>{item.title}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
