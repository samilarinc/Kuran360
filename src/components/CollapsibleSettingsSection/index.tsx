import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronUp, ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

interface CollapsibleSettingsSectionProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    color: string;
    expanded: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}

export const CollapsibleSettingsSection: React.FC<CollapsibleSettingsSectionProps> = ({
    title,
    subtitle,
    icon: Icon,
    color,
    expanded,
    onToggle,
    children,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <View style={styles.section}>
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <View style={styles.sectionHeaderContent}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: color + '1A' }]}>
                        <Icon size={20} color={color} />
                    </View>
                    <View style={common.flex1}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
                    </View>
                </View>
                <View style={[styles.expandButton, expanded && styles.expandButtonActive]}>
                    {expanded ? (
                        <ChevronUp size={16} color={theme.primary} />
                    ) : (
                        <ChevronDown size={16} color={theme.secondary} />
                    )}
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.sectionContent}>
                    {children}
                </View>
            )}
        </View>
    );
};
