import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ChecklistItem } from '@/components/ChecklistItem';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>
                {t('umrahChecklistScreen.checklistTitle')}
            </Text>

            {itemKeys.map((key) => (
                <ChecklistItem
                    key={key}
                    checked={checklist[key]}
                    onToggle={() => onToggleItem(key)}
                >
                    <Text style={[styles.checklistText, checklist[key] && common.checkedText]}>
                        {t(`umrahChecklistScreen.items.${key}`)}
                    </Text>
                </ChecklistItem>
            ))}
        </View>
    );
};
