import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ChecklistItem } from '@/components/ChecklistItem';

interface ChecklistSectionProps {
    itemKeys: string[];
    checklist: Record<string, boolean>;
    onToggleItem: (key: string) => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
    itemKeys,
    checklist,
    onToggleItem,
}) => {
    const { common } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={common.mbXl}>
            <Text style={[common.titleLarge, common.mbMd]}>
                {t('umrahChecklistScreen.checklistTitle')}
            </Text>

            {itemKeys.map((key) => (
                <ChecklistItem
                    key={key}
                    checked={checklist[key]}
                    onToggle={() => onToggleItem(key)}
                >
                    <Text style={[common.text, common.flex1, checklist[key] && common.checkedText]}>
                        {t(`umrahChecklistScreen.items.${key}`)}
                    </Text>
                </ChecklistItem>
            ))}
        </View>
    );
};
