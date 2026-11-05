import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TAFSIR_SOURCES } from '@/services/tafsir';

/**
 * Settings: which tafsir the tafsir page opens with. Downloading tafsirs for offline use is on the data management
 * screen.
 */
export const TafsirSettingsSection: React.FC = () => {
    const { common } = useTheme();
    const { t } = useTranslation();
    const { settings, updateSettings } = useSettings();

    return (
        <View>
            {TAFSIR_SOURCES.map(source => {
                const isSelected = settings.tafsirSource === source.id;
                return (
                    <TouchableOpacity
                        key={source.id}
                        style={[common.pickerOption, isSelected && common.pickerOptionSelected]}
                        onPress={() => updateSettings({ tafsirSource: source.id })}
                        activeOpacity={0.7}
                    >
                        <View style={[common.row, common.gapSm]}>
                            <View style={[common.pickerRadio, isSelected && common.pickerRadioSelected]}>
                                {isSelected && <View style={common.pickerRadioDot} />}
                            </View>
                            <Text style={[common.textStrong, common.flex1, isSelected && common.textAccent]}>
                                {t(`tafsir.sources.${source.id}.name`)}
                            </Text>
                        </View>
                        <Text style={[common.smallText, common.pickerRadioIndented]}>
                            {t(`tafsir.sources.${source.id}.description`)}
                        </Text>
                    </TouchableOpacity>
                );
            })}
            <Text style={[common.smallText, common.pMd]}>{t('tafsir.downloadNote')}</Text>
        </View>
    );
};
