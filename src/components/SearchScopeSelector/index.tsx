import React from 'react';
import { Globe, Star, BookOpen, Library, Type, PenLine } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SearchFilterGroup } from '@/components/SearchFilterGroup';
import { SearchFilterPill } from '@/components/SearchFilterPill';

export type SearchScope = 'everywhere' | 'favorite' | 'selected' | 'all-translations' | 'arabic' | 'transliteration';

interface SearchScopeSelectorProps {
    scope: SearchScope;
    onChange: (scope: SearchScope) => void;
}

export const SearchScopeSelector: React.FC<SearchScopeSelectorProps> = ({ scope, onChange }) => {
    const { t } = useTranslation();

    const options: { key: SearchScope; label: string; icon: typeof Globe }[] = [
        { key: 'everywhere', label: t('searchScreen.scope.everywhere'), icon: Globe },
        { key: 'favorite', label: t('searchScreen.scope.favorite'), icon: Star },
        { key: 'selected', label: t('searchScreen.scope.selected'), icon: BookOpen },
        { key: 'all-translations', label: t('searchScreen.scope.allTranslations'), icon: Library },
        { key: 'arabic', label: t('searchScreen.scope.arabic'), icon: Type },
        { key: 'transliteration', label: t('searchScreen.scope.transliteration'), icon: PenLine },
    ];

    return (
        <SearchFilterGroup title={t('searchScreen.scope.title')}>
            {options.map((option) => (
                <SearchFilterPill
                    key={option.key}
                    label={option.label}
                    icon={option.icon}
                    selected={scope === option.key}
                    onPress={() => onChange(option.key)}
                />
            ))}
        </SearchFilterGroup>
    );
};
