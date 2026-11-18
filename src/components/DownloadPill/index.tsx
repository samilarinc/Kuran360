import React, { useEffect, useReducer } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, TriangleAlert } from 'lucide-react-native';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useActiveDownloads } from '@/services/downloads';
import { createStyles } from './index.styles';

// How long a failed download stays flagged in red
const FAILED_VISIBLE_MS = 5000;

/** What a download key is, in a few words: "Speech model", "Tafsir"… */
const labelKey = (key: string) => {
    if (key === 'quran') return 'downloadPill.items.quran';
    if (key === 'topic') return 'downloadPill.items.topic';
    if (key.startsWith('tafsir:')) return 'downloadPill.items.tafsir';
    return 'downloadPill.items.model';
};

/**
 * Small floating pill shown on every screen while something downloads; opens the data management page.
 * A failed download turns it red for a few seconds, so the failure isn't missed on another page.
 */
export const DownloadPill: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { goToDataManagement } = useNavigationHelpers();
    const { running, failed } = useActiveDownloads(FAILED_VISIBLE_MS);
    const [, rerender] = useReducer((n: number) => n + 1, 0);

    // Re-render once a failure's moment is over, so the pill hides
    useEffect(() => {
        if (failed.length === 0) return;
        const timer = setTimeout(rerender, FAILED_VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [failed.length]);

    if (running.length === 0 && failed.length === 0) return null;

    const showFailure = running.length === 0;
    const text = showFailure
        ? t('downloadPill.failed', { item: t(labelKey(failed[0].key)) })
        : running.length === 1
            ? t('downloadPill.one', { item: t(labelKey(running[0].key)) })
            : t('downloadPill.many', { count: running.length });
    const percent = Math.round(running.reduce((sum, item) => sum + item.progress, 0) / Math.max(running.length, 1));

    return (
        <TouchableOpacity
            style={[styles.pill, showFailure && styles.pillFailed]}
            onPress={goToDataManagement}
            activeOpacity={0.85}
            accessibilityRole="button"
        >
            {showFailure
                ? <TriangleAlert size={16} color={theme.headerText} />
                : <ArrowDownToLine size={16} color={theme.headerText} />}
            <Text style={styles.label} numberOfLines={1}>{text}</Text>
            {/* Kept outside the label so a long name never cuts it off */}
            {!showFailure && <Text style={styles.percent}>{t('downloadPill.percent', { percent })}</Text>}
        </TouchableOpacity>
    );
};
