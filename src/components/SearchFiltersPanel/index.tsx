import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Surah } from '@/types';
import { SearchScopeSelector, SearchScope } from '@/components/SearchScopeSelector';
import { TranslationScopeSelector } from '@/components/TranslationScopeSelector';
import { SurahFilterSelector } from '@/components/SurahFilterSelector';
import { MatchTypeSelector } from '@/components/MatchTypeSelector';
import { createStyles } from './index.styles';

type SurahFilter = 'all' | number;

interface SearchFiltersPanelProps {
    expanded: boolean;
    onToggleExpanded: () => void;

    searchScope: SearchScope;
    onChangeScope: (scope: SearchScope) => void;

    selectedTranslation: string;
    availableTranslations: string[];
    showTranslationDropdown: boolean;
    onToggleTranslationDropdown: () => void;
    onSelectTranslation: (translation: string) => void;

    surahs: Surah[];
    surahFilter: SurahFilter;
    selectedSurah: number | null;
    showSpecificSurah: boolean;
    onSelectAllSurahs: () => void;
    onToggleSpecificSurah: () => void;
    onSelectSurah: (surahNumber: number) => void;

    useFuzzySearch: boolean;
    onChangeFuzzySearch: (useFuzzy: boolean) => void;
}

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
    expanded,
    onToggleExpanded,
    searchScope,
    onChangeScope,
    selectedTranslation,
    availableTranslations,
    showTranslationDropdown,
    onToggleTranslationDropdown,
    onSelectTranslation,
    surahs,
    surahFilter,
    selectedSurah,
    showSpecificSurah,
    onSelectAllSurahs,
    onToggleSpecificSurah,
    onSelectSurah,
    useFuzzySearch,
    onChangeFuzzySearch,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <>
            <TouchableOpacity style={styles.filtersToggle} onPress={onToggleExpanded}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Filter size={14} color={theme.text} />
                    <Text style={styles.filtersToggleText}>
                        {t('searchScreen.filtersToggle')}
                    </Text>
                </View>
                {expanded ? (
                    <ChevronUp size={16} color={theme.textSecondary} />
                ) : (
                    <ChevronDown size={16} color={theme.textSecondary} />
                )}
            </TouchableOpacity>

            {expanded && (
                <View style={styles.filtersContainer}>
                    <SearchScopeSelector scope={searchScope} onChange={onChangeScope} />

                    <TranslationScopeSelector
                        visible={searchScope === 'selected'}
                        selectedTranslation={selectedTranslation}
                        availableTranslations={availableTranslations}
                        showDropdown={showTranslationDropdown}
                        onToggleDropdown={onToggleTranslationDropdown}
                        onSelectTranslation={onSelectTranslation}
                    />

                    <SurahFilterSelector
                        surahs={surahs}
                        surahFilter={surahFilter}
                        selectedSurah={selectedSurah}
                        showSpecificSurah={showSpecificSurah}
                        onSelectAll={onSelectAllSurahs}
                        onToggleSpecific={onToggleSpecificSurah}
                        onSelectSurah={onSelectSurah}
                    />

                    <MatchTypeSelector useFuzzySearch={useFuzzySearch} onChange={onChangeFuzzySearch} />
                </View>
            )}
        </>
    );
};
