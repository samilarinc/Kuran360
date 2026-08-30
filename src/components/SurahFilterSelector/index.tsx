import React from 'react';
import { useTranslation } from 'react-i18next';
import { getSurahName } from '@/utils/surahName';
import { Surah } from '@/types';
import { SearchFilterGroup } from '@/components/SearchFilterGroup';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { SearchFilterDropdown } from '@/components/SearchFilterDropdown';
import { DropdownToggleIcon } from '@/components/DropdownToggleIcon';

type SurahFilter = 'all' | number;

interface SurahFilterSelectorProps {
    surahs: Surah[];
    surahFilter: SurahFilter;
    selectedSurah: number | null;
    showSpecificSurah: boolean;
    onSelectAll: () => void;
    onToggleSpecific: () => void;
    onSelectSurah: (surahNumber: number) => void;
}

export const SurahFilterSelector: React.FC<SurahFilterSelectorProps> = ({
    surahs,
    surahFilter,
    selectedSurah,
    showSpecificSurah,
    onSelectAll,
    onToggleSpecific,
    onSelectSurah,
}) => {
    const { t } = useTranslation();

    const selectedSurahObj = selectedSurah ? surahs.find(s => s.number === selectedSurah) : null;
    const selectedSurahLabel = selectedSurahObj ? `(${selectedSurah}. ${getSurahName(t, selectedSurahObj)})` : '';

    return (
        <SearchFilterGroup
            title={t('searchScreen.surahFilter.title')}
            footer={showSpecificSurah && (
                <SearchFilterDropdown>
                    {surahs.map((surah) => (
                        <SearchFilterPill
                            key={surah.number}
                            label={`${surah.number}. ${getSurahName(t, surah)}`}
                            selected={selectedSurah === surah.number}
                            onPress={() => onSelectSurah(surah.number)}
                        />
                    ))}
                </SearchFilterDropdown>
            )}
        >
            <SearchFilterPill
                label={t('searchScreen.surahFilter.all')}
                selected={surahFilter === 'all'}
                onPress={onSelectAll}
            />
            <SearchFilterPill
                label={`${t('searchScreen.surahFilter.selectedSurah')} ${selectedSurahLabel}`}
                selected={surahFilter !== 'all'}
                onPress={onToggleSpecific}
                trailing={<DropdownToggleIcon expanded={showSpecificSurah} />}
            />
        </SearchFilterGroup>
    );
};
