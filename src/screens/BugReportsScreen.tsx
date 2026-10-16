import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { isAdminUid } from '@/constants/admin';
import { BugReport, BugReportStatus, fetchBugReports, setBugReportStatus, deleteBugReport } from '@/services/bugReport';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

type Filter = BugReportStatus | 'all';
const FILTERS: Filter[] = ['new', 'resolved', 'all'];

export const BugReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { user } = useAuth();
    const isAdmin = isAdminUid(user?.uid);

    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<Filter>('new');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError('');
        try {
            setReports(await fetchBugReports());
        } catch (e) {
            console.error('Error loading bug reports:', e);
            setError(t('bugReportsScreen.loadError'));
        }
    }, [t]);

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        load().finally(() => setLoading(false));
    }, [isAdmin, load]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleToggleStatus = async (report: BugReport) => {
        const status: BugReportStatus = report.status === 'resolved' ? 'new' : 'resolved';
        try {
            await setBugReportStatus(report.id, status);
            setReports(prev => prev.map(r => (r.id === report.id ? { ...r, status } : r)));
        } catch (e) {
            console.error('Error updating bug report:', e);
            setError(t('bugReportsScreen.updateError'));
        }
    };

    const removeReport = async (id: string) => {
        try {
            await deleteBugReport(id);
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error('Error deleting bug report:', e);
            setError(t('bugReportsScreen.updateError'));
        }
    };

    const handleDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if ((globalThis as any).confirm?.(t('bugReportsScreen.deleteConfirm'))) removeReport(id);
            return;
        }
        Alert.alert(t('bugReportsScreen.deleteTitle'), t('bugReportsScreen.deleteConfirm'), [
            { text: t('bugReportsScreen.cancel'), style: 'cancel' },
            { text: t('bugReportsScreen.delete'), style: 'destructive', onPress: () => removeReport(id) },
        ]);
    };

    const counts: Record<Filter, number> = {
        new: reports.filter(r => r.status !== 'resolved').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        all: reports.length,
    };
    const visibleReports = reports.filter(r =>
        filter === 'all' || (filter === 'resolved' ? r.status === 'resolved' : r.status !== 'resolved'),
    );
    const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';

    const renderReport = (report: BugReport) => {
        const expanded = expandedId === report.id;
        const resolved = report.status === 'resolved';
        const sender = [report.name, report.email].filter(Boolean).join(' · ') || t('bugReportsScreen.anonymous');
        const device = [report.platform, report.osVersion, report.appVersion && `v${report.appVersion}`].filter(Boolean).join(' · ');

        return (
            <View key={report.id} style={[common.sectionCardCompact, common.mbSm, resolved && styles.resolvedCard]}>
                <View style={[common.rowBetween, common.mbXs]}>
                    <Text style={common.smallText}>{new Date(report.createdAt).toLocaleString(locale)}</Text>
                    <Text style={[common.badgeText, resolved ? styles.statusResolved : styles.statusNew]}>
                        {t(`bugReportsScreen.status.${resolved ? 'resolved' : 'new'}`)}
                    </Text>
                </View>

                <Text style={[common.text, common.mbSm]} selectable>{report.message}</Text>

                <Text style={common.textAccent} selectable>{sender}</Text>
                <Text style={common.smallText} selectable>
                    {[report.screen && t('bugReportsScreen.screenLabel', { screen: report.screen }), device].filter(Boolean).join('  ·  ')}
                </Text>

                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : report.id)} style={styles.detailsToggle}>
                    <Text style={common.textAccent}>
                        {expanded ? t('bugReportsScreen.hideDetails') : t('bugReportsScreen.showDetails')}
                    </Text>
                </TouchableOpacity>

                {expanded && (
                    <View style={common.mbSm}>
                        <DetailRow label={t('bugReportsScreen.deviceModel')} value={report.deviceModel} />
                        <DetailRow label={t('bugReportsScreen.language')} value={report.language} />
                        <DetailRow label="UID" value={report.uid} />
                        <DetailRow label={t('bugReportsScreen.settings')} value={report.settings} mono />
                        <DetailRow label={t('bugReportsScreen.logs')} value={report.logs || t('bugReportsScreen.noLogs')} mono />
                    </View>
                )}

                <View style={common.rowGap}>
                    <AppButton
                        title={resolved ? t('bugReportsScreen.reopen') : t('bugReportsScreen.markResolved')}
                        onPress={() => handleToggleStatus(report)}
                        variant={resolved ? 'outline' : 'primary'}
                        size="small"
                        style={common.flex1}
                    />
                    <AppButton
                        title={t('bugReportsScreen.delete')}
                        onPress={() => handleDelete(report.id)}
                        variant="danger"
                        size="small"
                    />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.bugReports')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />

            {loading ? (
                <LoadingView />
            ) : !isAdmin ? (
                <View style={common.emptyState}>
                    <Text style={common.emptyStateText}>{t('bugReportsScreen.notAuthorized')}</Text>
                </View>
            ) : (
                <ScrollView
                    style={common.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
                >
                    <View style={[common.rowWrap, common.mbMd]}>
                        {FILTERS.map(f => (
                            <SearchFilterPill
                                key={f}
                                label={`${t(`bugReportsScreen.filter.${f}`)} (${counts[f]})`}
                                selected={filter === f}
                                onPress={() => setFilter(f)}
                            />
                        ))}
                        {Platform.OS === 'web' && (
                            <AppButton title={t('bugReportsScreen.refresh')} onPress={handleRefresh} variant="ghost" size="small" loading={refreshing} />
                        )}
                    </View>

                    {!!error && <Text style={styles.errorText}>{error}</Text>}

                    {visibleReports.length === 0 ? (
                        <Text style={styles.emptyText}>{t('bugReportsScreen.empty')}</Text>
                    ) : (
                        visibleReports.map(renderReport)
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const DetailRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <Text style={[common.sectionLabel, common.mbXs]}>{label}</Text>
            <Text style={mono ? styles.monoText : common.text} selectable>{value}</Text>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    resolvedCard: {
        opacity: 0.7,
    },
    statusNew: {
        color: theme.primary,
    },
    statusResolved: {
        color: theme.textSecondary,
    },
    detailsToggle: {
        paddingVertical: SPACING.sm,
    },
    detailRow: {
        marginTop: SPACING.sm,
    },
    monoText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: FONT_SIZES.small - 2,
        color: theme.text,
        backgroundColor: theme.background,
        padding: SPACING.sm,
        borderRadius: 6,
    },
    errorText: {
        ...common.smallText,
        color: theme.error,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        ...common.emptyStateText,
        marginVertical: SPACING.lg,
    },
});
