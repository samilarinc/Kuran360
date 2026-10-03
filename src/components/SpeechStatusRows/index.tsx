import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TFunction } from 'i18next';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';
import type { DeviceSupport } from '@/services/verseFinder';
import type { VerseModel } from '@/services/verseModels';
import type { ModelState } from '@/hooks/useSpeechRecognizer';

export interface StatusRow {
    label: string;
    color: string;
    value: string;
}

/** The "speech model" and (on the web) "WebGPU" rows shared by the screens that recognize speech. */
export const getSpeechEngineRows = (
    t: TFunction,
    theme: Theme,
    support: DeviceSupport | null,
    activeModel: VerseModel | null,
    modelState: ModelState,
): StatusRow[] => {
    const ok = theme.success;
    const warn = theme.warning;
    const bad = theme.error;
    const muted = theme.textSecondary;

    const modelRow = !activeModel
        ? { color: bad, value: t('verseFinder.status.noModel') }
        : {
            color: modelState.status === 'ready' ? ok : modelState.status === 'error' ? bad : modelState.status === 'loading' ? warn : muted,
            value: `${t(`verseFinder.models.${activeModel.id}.name`)} · ${t(`verseFinder.status.modelStates.${modelState.status}`)}`,
        };

    const webgpuRow = !support
        ? { color: muted, value: t('verseFinder.status.checking') }
        : support.webgpu === 'available'
            ? support.softwareGpu
                ? { color: warn, value: t('verseFinder.status.webgpuSoftware') }
                : { color: ok, value: support.gpuName ? `${t('verseFinder.status.yes')} · ${support.gpuName}` : t('verseFinder.status.yes') }
            : support.webgpu === 'noAdapter'
                ? { color: warn, value: t('verseFinder.status.webgpuNoAdapter') }
                : { color: warn, value: t('verseFinder.status.webgpuUnsupported') };

    return [
        { label: t('verseFinder.status.model'), ...modelRow },
        // The Android app runs its model on the CPU
        ...(Platform.OS === 'web' ? [{ label: t('verseFinder.status.webgpu'), ...webgpuRow }] : []),
    ];
};

export const SpeechStatusRows: React.FC<{ rows: StatusRow[] }> = ({ rows }) => {
    const styles = useThemedStyles(createStyles);
    return (
        <>
            {rows.map(row => (
                <View key={row.label} style={styles.row}>
                    <Text style={styles.label}>{row.label}</Text>
                    <View style={styles.valueWrap}>
                        <View style={[styles.dot, { backgroundColor: row.color }]} />
                        <Text style={styles.value}>{row.value}</Text>
                    </View>
                </View>
            ))}
        </>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    row: {
        ...common.rowBetween,
        paddingVertical: SPACING.xs,
        gap: SPACING.md,
    },
    label: {
        ...common.text,
    },
    valueWrap: {
        ...common.row,
        flex: 1,
        justifyContent: 'flex-end',
    },
    value: {
        ...common.text,
        flexShrink: 1,
        textAlign: 'right',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.xs,
    },
});
