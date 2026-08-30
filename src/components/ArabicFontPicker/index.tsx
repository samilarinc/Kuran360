import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BookOpen, Image as ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { ARABIC_FONT_OPTIONS, getArabicFontFamily } from '@/constants/fonts';
import { createStyles } from './index.styles';

interface ArabicFontPickerProps {
    settings: any;
    updateSettings: (partial: any) => void;
}

export const ArabicFontPicker: React.FC<ArabicFontPickerProps> = ({ settings, updateSettings }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { width: screenWidth } = useWindowDimensions();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Section padding ~32px each side + sectionContent padding ~16px = ~96px total
    const available = screenWidth - 96;
    const gap = SPACING.sm; // 8px
    const minChipW = 90;
    const rawPerRow = Math.floor((available + gap) / (minChipW + gap));
    const perRow = Math.max(2, rawPerRow);
    const total = ARABIC_FONT_OPTIONS.length;
    const numRows = Math.ceil(total / perRow);
    const evenPerRow = Math.ceil(total / numRows);
    const rows: typeof ARABIC_FONT_OPTIONS[] = [];
    for (let i = 0; i < total; i += evenPerRow) {
        rows.push(ARABIC_FONT_OPTIONS.slice(i, i + evenPerRow));
    }
    const chipWidth = (available - (evenPerRow - 1) * gap) / evenPerRow;

    const groups: { key: 'arabicFont' | 'imageArabicFont'; Icon: typeof BookOpen; label: string }[] = [
        { key: 'arabicFont', Icon: BookOpen, label: t('settingsScreen.fonts.readingFont') },
        { key: 'imageArabicFont', Icon: ImageIcon, label: t('settingsScreen.fonts.imageFont') },
    ];

    return (
        <View>
            {groups.map(({ key, Icon, label }, groupIdx) => (
                <View key={key} style={{ marginBottom: groupIdx === 0 ? SPACING.lg : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.xs }}>
                        <Icon size={14} color={theme.textSecondary} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, letterSpacing: 0.3 }}>
                            {label}
                        </Text>
                    </View>
                    {rows.map((row, rowIdx) => (
                        <View key={rowIdx} style={{ flexDirection: 'row', gap, marginBottom: rowIdx < rows.length - 1 ? gap : 0 }}>
                            {row.map(font => {
                                const isSelected = settings[key] === font.id;
                                return (
                                    <TouchableOpacity
                                        key={font.id}
                                        onPress={() => updateSettings({ [key]: font.id })}
                                        style={[
                                            styles.fontChip,
                                            { width: chipWidth },
                                            isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                                        ]}
                                    >
                                        <Text style={[styles.fontChipArabic, { fontFamily: getArabicFontFamily(font), color: isSelected ? '#fff' : theme.text }]}>
                                            {font.labelAr}
                                        </Text>
                                        <Text style={[styles.fontChipLabel, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
                                            {font.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};
