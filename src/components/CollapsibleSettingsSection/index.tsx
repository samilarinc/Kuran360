import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronUp, ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';

interface CollapsibleSettingsSectionProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    color: string;
    /** Unused with `link` */
    expanded?: boolean;
    /** Expands/collapses the section, or with `link` opens its page */
    onToggle: () => void;
    /** A section that opens a page of its own instead of expanding, drawn the same way */
    link?: boolean;
    children?: React.ReactNode;
}

export const CollapsibleSettingsSection: React.FC<CollapsibleSettingsSectionProps> = ({
    title,
    subtitle,
    icon: Icon,
    color,
    expanded = false,
    onToggle,
    link = false,
    children,
}) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={styles.section}>
            <TouchableOpacity
                style={[styles.sectionHeader, link && styles.sectionHeaderLink]}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <View style={common.rowFill}>
                    <View style={[common.iconBox, { backgroundColor: color + '1A' }]}>
                        <Icon size={20} color={color} />
                    </View>
                    <View style={common.flex1}>
                        <Text style={common.textStrong}>{title}</Text>
                        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
                    </View>
                </View>
                <View style={[styles.expandButton, expanded && styles.expandButtonActive]}>
                    {link ? (
                        <ChevronRight size={16} color={theme.secondary} />
                    ) : expanded ? (
                        <ChevronUp size={16} color={theme.primary} />
                    ) : (
                        <ChevronDown size={16} color={theme.secondary} />
                    )}
                </View>
            </TouchableOpacity>

            {expanded && !link && (
                <View>
                    {children}
                </View>
            )}
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        section: {
            ...common.card,
            padding: 0,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SPACING.lg,
            backgroundColor: theme.primary + '08',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        sectionHeaderLink: {
            borderBottomWidth: 0,
        },
        sectionSubtitle: {
            ...common.smallText,
            color: theme.secondary,
        },
        expandButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.border + '30',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: SPACING.md,
        },
        expandButtonActive: {
            backgroundColor: theme.primary + '20',
        },
    });
};
