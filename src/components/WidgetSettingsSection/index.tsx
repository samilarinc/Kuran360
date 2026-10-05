import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { SurahVersePickerModal } from '@/components/SurahVersePickerModal';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { getSurahNameByNumber } from '@/utils/surahName';
import { Theme, SPACING } from '@/theme';
import { WidgetVerseMode } from '@/types';

const MODES: WidgetVerseMode[] = ['prayer', 'tap', 'fixed'];

/** Settings of the home screen verse widgets: how the verse changes, and the verse to show when it is fixed. */
export const WidgetSettingsSection: React.FC = () => {
    const { t } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { settings, updateSettings } = useSettings();
    const [pickerVisible, setPickerVisible] = useState(false);
    const fixed = settings.widgetFixedVerse;

    return (
        <View style={styles.container}>
            <Text style={common.textStrong}>{t('widgets.verseTitle')}</Text>
            <Text style={[common.smallText, styles.description]}>{t('widgets.verseDescription')}</Text>

            {MODES.map(mode => {
                const selected = settings.widgetVerseMode === mode;
                return (
                    <TouchableOpacity
                        key={mode}
                        style={[common.pickerOption, common.rowBetween, common.gapSm, selected && common.pickerOptionSelected]}
                        onPress={() => updateSettings({ widgetVerseMode: mode })}
                    >
                        <View style={common.flex1}>
                            <Text style={common.textStrong}>{t(`widgets.modes.${mode}.title`)}</Text>
                            <Text style={common.smallText}>{t(`widgets.modes.${mode}.description`)}</Text>
                        </View>
                        {selected && <Check size={18} color={theme.primary} />}
                    </TouchableOpacity>
                );
            })}

            {settings.widgetVerseMode === 'fixed' && (
                <View style={[common.rowBetween, common.gapSm, styles.fixedRow]}>
                    <Text style={[common.textStrong, common.flex1]}>
                        {t('widgets.verseRef', { surah: getSurahNameByNumber(t, fixed.surah), verse: fixed.verse })}
                    </Text>
                    <AppButton title={t('widgets.changeVerse')} variant="outline" size="small" onPress={() => setPickerVisible(true)} />
                </View>
            )}

            <SurahVersePickerModal
                visible={pickerVisible}
                singleOnly
                title={t('widgets.pickerTitle')}
                confirmTitle={t('widgets.pickerConfirm')}
                confirmIcon={<Check size={16} color="#FFFFFF" />}
                selection={{ surahNumber: fixed.surah, scope: 'single', fromVerse: fixed.verse, toVerse: fixed.verse }}
                onSelect={selection => updateSettings({ widgetFixedVerse: { surah: selection.surahNumber, verse: selection.fromVerse } })}
                onClose={() => setPickerVisible(false)}
            />
        </View>
    );
};

const createStyles = (_theme: Theme, _common: CommonStyles) => {
    return StyleSheet.create({
        container: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
        },
        description: {
            marginBottom: SPACING.sm,
        },
        fixedRow: {
            marginTop: SPACING.sm,
        },
    });
};
