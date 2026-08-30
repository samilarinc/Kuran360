import React from 'react';
import { Target, Search as SearchIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SearchFilterGroup } from '@/components/SearchFilterGroup';
import { SearchFilterPill } from '@/components/SearchFilterPill';

interface MatchTypeSelectorProps {
    useFuzzySearch: boolean;
    onChange: (useFuzzy: boolean) => void;
}

export const MatchTypeSelector: React.FC<MatchTypeSelectorProps> = ({ useFuzzySearch, onChange }) => {
    const { t } = useTranslation();

    return (
        <SearchFilterGroup title={t('searchScreen.matchType.type')}>
            <SearchFilterPill
                label={t('searchScreen.matchType.exact')}
                icon={Target}
                selected={!useFuzzySearch}
                onPress={() => onChange(false)}
            />
            <SearchFilterPill
                label={t('searchScreen.matchType.fuzzy')}
                icon={SearchIcon}
                selected={useFuzzySearch}
                onPress={() => onChange(true)}
            />
        </SearchFilterGroup>
    );
};
