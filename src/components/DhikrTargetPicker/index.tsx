import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { TARGET_OPTIONS } from '@/data/dhikrPresets';
import { MAX_TARGET } from '@/services/zikirmatik';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface DhikrTargetPickerProps {
    value: number;
    onChange: (target: number) => void;
}

/** Target chips (33 / 99 / 100 / 500 / 1000) plus a field for any other number. */
export const DhikrTargetPicker: React.FC<DhikrTargetPickerProps> = ({ value, onChange }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [customOpen, setCustomOpen] = useState(!TARGET_OPTIONS.includes(value));
    const [customText, setCustomText] = useState(TARGET_OPTIONS.includes(value) ? '' : String(value));

    // A target changed from outside (another dhikr was opened) resets the field
    useEffect(() => {
        const isPreset = TARGET_OPTIONS.includes(value);
        setCustomOpen(!isPreset);
        setCustomText(isPreset ? '' : String(value));
    }, [value]);

    const handleCustomChange = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, 5);
        setCustomText(digits);
        const number = Number(digits);
        if (number > 0) onChange(Math.min(number, MAX_TARGET));
    };

    return (
        <View style={styles.container}>
            <View style={styles.pills}>
                {TARGET_OPTIONS.map(option => (
                    <SearchFilterPill
                        key={option}
                        label={String(option)}
                        selected={!customOpen && value === option}
                        onPress={() => {
                            setCustomOpen(false);
                            onChange(option);
                        }}
                    />
                ))}
                <SearchFilterPill
                    label={t('zikirmatik.customTarget')}
                    selected={customOpen}
                    onPress={() => setCustomOpen(true)}
                />
            </View>
            {customOpen && (
                <TextInput
                    style={[common.compactInput, styles.customInput]}
                    value={customText}
                    onChangeText={handleCustomChange}
                    keyboardType="number-pad"
                    placeholder={t('zikirmatik.customTargetPlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    maxLength={5}
                />
            )}
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    container: {
        gap: SPACING.sm,
    },
    pills: {
        ...common.rowWrap,
        gap: SPACING.sm,
    },
    customInput: {
        fontSize: FONT_SIZES.medium,
    },
});
