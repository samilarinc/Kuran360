import React from 'react';
import { useTranslation } from 'react-i18next';
import { SearchFilterGroup } from '@/components/SearchFilterGroup';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { SearchFilterDropdown } from '@/components/SearchFilterDropdown';
import { DropdownToggleIcon } from '@/components/DropdownToggleIcon';

interface TranslationScopeSelectorProps {
    visible: boolean;
    selectedTranslation: string;
    availableTranslations: string[];
    showDropdown: boolean;
    onToggleDropdown: () => void;
    onSelectTranslation: (translation: string) => void;
}

export const TranslationScopeSelector: React.FC<TranslationScopeSelectorProps> = ({
    visible,
    selectedTranslation,
    availableTranslations,
    showDropdown,
    onToggleDropdown,
    onSelectTranslation,
}) => {
    const { t } = useTranslation();

    if (!visible) return null;

    const truncatedSelected = selectedTranslation
        ? `(${selectedTranslation.length > 20 ? selectedTranslation.substring(0, 20) + '...' : selectedTranslation})`
        : '';

    return (
        <SearchFilterGroup
            title={t('searchScreen.translationSelector.title')}
            footer={showDropdown && (
                <SearchFilterDropdown>
                    {availableTranslations.map((translation) => (
                        <SearchFilterPill
                            key={translation}
                            label={translation.length > 15 ? translation.substring(0, 15) + '...' : translation}
                            selected={selectedTranslation === translation}
                            onPress={() => onSelectTranslation(translation)}
                        />
                    ))}
                </SearchFilterDropdown>
            )}
        >
            <SearchFilterPill
                label={t('searchScreen.translationSelector.selected', { translation: truncatedSelected })}
                selected
                onPress={onToggleDropdown}
                trailing={<DropdownToggleIcon expanded={showDropdown} />}
            />
        </SearchFilterGroup>
    );
};
