import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { LinkifiedText } from '@/components/LinkifiedText';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { useAuth } from '@/contexts/AuthContext';
import { useBugReport } from '@/contexts/BugReportContext';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { isAdminUid } from '@/constants/admin';
import {
    BugReport, BugReportStatus, fetchBugReports, resolveBugReport, reopenBugReport, deleteBugReport, MAX_RESOLUTION_NOTE_LENGTH,
} from '@/services/bugReport';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

type Filter = BugReportStatus | 'all';
const FILTERS: Filter[] = ['new', 'resolved', 'all'];

export const BugReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { user } = useAuth();
    const { openBugReport, submittedCount } = useBugReport();
    const isAdmin = isAdminUid(user?.uid);
    const uid = user?.uid;

    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<Filter>('new');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    // The report whose resolution note is being written, and the draft
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!uid) return;
        setError('');
        try {
            setReports(await fetchBugReports(uid, isAdmin));
        } catch (e) {
            console.error('Error loading bug reports:', e);
            setError(t('bugReportsScreen.loadError'));
        }
    }, [t, uid, isAdmin]);

    // Also reloads after a report is sent from the modal
    useEffect(() => {
        if (!uid) {
            setReports([]);
            setLoading(false);
            return;
        }
        load().finally(() => setLoading(false));
    }, [uid, load, submittedCount]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const updateLocal = (id: string, changes: Partial<BugReport>) =>
        setReports(prev => prev.map(r => (r.id === id ? { ...r, ...changes } : r)));

    const startResolving = (report: BugReport) => {
        setResolvingId(report.id);
        setNoteDraft(report.resolutionNote ?? '');
    };

    const handleResolve = async (id: string) => {
        setSaving(true);
        try {
            await resolveBugReport(id, noteDraft);
            updateLocal(id, { status: 'resolved', resolutionNote: noteDraft.trim(), resolvedAt: Date.now() });
            setResolvingId(null);
        } catch (e) {
            console.error('Error resolving bug report:', e);
            setError(t('bugReportsScreen.updateError'));
        } finally {
            setSaving(false);
        }
    };

    const handleReopen = async (id: string) => {
        try {
            await reopenBugReport(id);
            updateLocal(id, { status: 'new' });
        } catch (e) {
            console.error('Error reopening bug report:', e);
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
            <View key={report.id} style={[common.sectionCardCompact, common.mbSm]}>
                <View style={[common.rowBetween, common.mbXs]}>
                    <Text style={common.smallText}>{new Date(report.createdAt).toLocaleString(locale)}</Text>
                    <Text style={[common.badgeText, resolved ? styles.statusResolved : styles.statusNew]}>
                        {t(`bugReportsScreen.status.${resolved ? 'resolved' : 'new'}`)}
                    </Text>
                </View>

                <Text style={[common.text, common.mbSm]} selectable>{report.message}</Text>

                {isAdmin && <Text style={common.textAccent} selectable>{sender}</Text>}
                <Text style={common.smallText} selectable>
                    {[report.screen && t('bugReportsScreen.screenLabel', { screen: report.screen }), device].filter(Boolean).join('  ·  ')}
                </Text>

                {resolved && !!report.resolutionNote && resolvingId !== report.id && (
                    <View style={styles.noteBox}>
                        <Text style={[common.sectionLabel, common.mbXs]}>{t('bugReportsScreen.resolutionNote')}</Text>
                        <LinkifiedText style={common.text} selectable>{report.resolutionNote}</LinkifiedText>
                    </View>
                )}

                {/* Details and moderation are admin only; senders just follow their report's status */}
                {isAdmin && (
                    <>
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

                        {resolvingId === report.id ? (
                            <View>
                                <Text style={[common.sectionLabel, common.mbXs]}>{t('bugReportsScreen.resolutionNote')}</Text>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder={t('bugReportsScreen.resolutionNotePlaceholder')}
                                    placeholderTextColor={theme.textSecondary}
                                    multiline
                                    value={noteDraft}
                                    maxLength={MAX_RESOLUTION_NOTE_LENGTH}
                                    onChangeText={setNoteDraft}
                                    autoFocus
                                />
                                <View style={common.rowGap}>
                                    <AppButton
                                        title={t('bugReportsScreen.saveResolved')}
                                        onPress={() => handleResolve(report.id)}
                                        loading={saving}
                                        disabled={saving}
                                        size="small"
                                        style={common.flex1}
                                    />
                                    <AppButton
                                        title={t('bugReportsScreen.cancel')}
                                        onPress={() => setResolvingId(null)}
                                        variant="outline"
                                        size="small"
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={common.rowGap}>
                                <AppButton
                                    title={resolved ? t('bugReportsScreen.editNote') : t('bugReportsScreen.markResolved')}
                                    onPress={() => startResolving(report)}
                                    variant={resolved ? 'outline' : 'primary'}
                                    size="small"
                                    style={common.flex1}
                                />
                                {resolved && (
                                    <AppButton
                                        title={t('bugReportsScreen.reopen')}
                                        onPress={() => handleReopen(report.id)}
                                        variant="outline"
                                        size="small"
                                    />
                                )}
                                <AppButton
                                    title={t('bugReportsScreen.delete')}
                                    onPress={() => handleDelete(report.id)}
                                    variant="danger"
                                    size="small"
                                />
                            </View>
                        )}
                    </>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={isAdmin ? t('screenTitles.bugReports') : t('screenTitles.myBugReports')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />

            {loading ? (
                <LoadingView />
            ) : !uid ? (
                <View style={common.emptyState}>
                    <Text style={[common.emptyStateText, common.mbLg]}>{t('bugReportsScreen.signInToSee')}</Text>
                    <AppButton title={t('bugReportsScreen.newReport')} onPress={openBugReport} icon={<Plus size={16} color="#FFFFFF" />} />
                </View>
            ) : (
                <ScrollView
                    style={common.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
                >
                    <AppButton
                        title={t('bugReportsScreen.newReport')}
                        onPress={openBugReport}
                        icon={<Plus size={16} color="#FFFFFF" />}
                        style={common.mbMd}
                    />

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
    noteBox: {
        marginTop: SPACING.sm,
        padding: SPACING.sm,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: theme.primary,
        backgroundColor: theme.primary + '10',
    },
    noteInput: {
        ...common.input,
        ...common.textArea,
        backgroundColor: theme.background,
        marginBottom: SPACING.sm,
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
