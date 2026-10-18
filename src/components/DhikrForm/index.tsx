import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Boxes, Mic, Square } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { DhikrTargetPicker } from '@/components/DhikrTargetPicker';
import { ProgressBar } from '@/components/ProgressBar';
import { SpeechStatusRows, getSpeechEngineRows } from '@/components/SpeechStatusRows';
import { VerseModelManager } from '@/components/VerseModelManager';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { DEFAULT_TARGET } from '@/data/dhikrPresets';
import { useSpeechRecognizer } from '@/hooks/useSpeechRecognizer';
import { MAX_RECORDING_SECONDS } from '@/services/verseFinder';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { QuranSpeech } from '../../../modules/quran-speech';

interface DhikrFormProps {
    onSave: (dhikr: { text: string; target: number }) => void;
    onCancel: () => void;
}

/** Create a custom dhikr: its text (typed, or spoken on Android) and a target. */
export const DhikrForm: React.FC<DhikrFormProps> = ({ onSave, onCancel }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [text, setText] = useState('');
    const [target, setTarget] = useState(DEFAULT_TARGET);

    // Heard words land in the text field, where the user can fix them before saving
    const appendHeard = useCallback((heard: string) => {
        if (heard) setText(current => (current.trim() ? `${current.trim()} ${heard}` : heard));
    }, []);

    return (
        <View style={styles.container}>
            <View style={common.sectionCard}>
                <Text style={[common.sectionLabel, common.mbXs]}>{t('zikirmatik.form.textLabel')}</Text>
                <TextInput
                    style={[common.input, styles.textInput]}
                    value={text}
                    onChangeText={setText}
                    placeholder={t('zikirmatik.form.textPlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    textAlignVertical="top"
                />
                {QuranSpeech && <DhikrVoiceInput onHeard={appendHeard} />}
            </View>

            <View style={common.sectionCard}>
                <Text style={[common.sectionLabel, common.mbSm]}>{t('zikirmatik.form.targetLabel')}</Text>
                <DhikrTargetPicker value={target} onChange={setTarget} />
            </View>

            <View style={styles.buttons}>
                <AppButton title={t('common.cancel')} variant="outline" onPress={onCancel} style={common.flex1} />
                <AppButton
                    title={t('zikirmatik.form.save')}
                    onPress={() => onSave({ text: text.trim(), target })}
                    disabled={!text.trim()}
                    style={common.flex1}
                />
            </View>
        </View>
    );
};

/** Records a few seconds of speech and hands over what the on-device model heard; nothing is matched against verses. */
const DhikrVoiceInput: React.FC<{ onHeard: (text: string) => void }> = ({ onHeard }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [managerVisible, setManagerVisible] = useState(false);
    const [heardNothing, setHeardNothing] = useState(false);

    const recognizer = useSpeechRecognizer(heard => {
        setHeardNothing(!heard);
        onHeard(heard);
    });
    const { support, activeModel, modelState, phase, elapsed, error, canRecord, busy } = recognizer;

    const hint = !activeModel
        ? t('verseFinder.noModel')
        : phase === 'recording'
            ? t('verseFinder.listening', { seconds: elapsed, max: MAX_RECORDING_SECONDS })
            : phase === 'recognizing'
                ? modelState.status === 'loading' ? t('verseFinder.loadingModel') : t('zikirmatik.form.transcribing')
                : t('zikirmatik.form.voiceHint');

    return (
        <View style={styles.voice}>
            <View style={styles.voiceRow}>
                <TouchableOpacity
                    style={[styles.micButton, phase === 'recording' && styles.micButtonRecording, (!canRecord || phase === 'recognizing') && common.disabled]}
                    onPress={() => {
                        setHeardNothing(false);
                        recognizer.toggleRecording();
                    }}
                    disabled={!canRecord || phase === 'recognizing'}
                    activeOpacity={0.85}
                    accessibilityLabel={phase === 'recording' ? t('verseFinder.stop') : t('zikirmatik.form.voiceStart')}
                >
                    {phase === 'recording'
                        ? <Square size={22} color="#fff" fill="#fff" />
                        : <Mic size={26} color="#fff" />}
                </TouchableOpacity>
                <Text style={[common.smallText, common.flex1]}>{support && !support.microphone ? t('verseFinder.errors.unsupported') : hint}</Text>
                <AppButton
                    icon={<Boxes size={16} color={activeModel ? theme.primary : '#FFFFFF'} />}
                    title={t('verseFinder.manageModels')}
                    variant={activeModel ? 'ghost' : 'primary'}
                    size="small"
                    onPress={() => setManagerVisible(true)}
                    disabled={busy}
                />
            </View>
            {phase === 'recording' && <ProgressBar progress={(elapsed / MAX_RECORDING_SECONDS) * 100} />}
            {heardNothing && phase === 'done' && !error && <Text style={common.note}>{t('zikirmatik.form.nothingHeard')}</Text>}
            {error && <Text style={common.note}>{error}</Text>}
            {modelState.status === 'error' && <Text style={common.smallText}>{modelState.message}</Text>}
            <SpeechStatusRows rows={getSpeechEngineRows(t, theme, support, activeModel, modelState)} />

            <VerseModelManager
                visible={managerVisible}
                onClose={() => setManagerVisible(false)}
                support={support}
                selectedId={recognizer.selectedId}
                downloaded={recognizer.downloaded}
                onSelect={recognizer.selectModel}
                onChanged={recognizer.refreshDownloaded}
            />
        </View>
    );
};

const MIC_SIZE = 52;

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    container: {
        gap: SPACING.md,
    },
    textInput: {
        minHeight: 96,
        fontSize: FONT_SIZES.large,
    },
    buttons: {
        ...common.row,
        gap: SPACING.sm,
    },
    voice: {
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    voiceRow: {
        ...common.row,
        gap: SPACING.sm,
    },
    micButton: {
        width: MIC_SIZE,
        height: MIC_SIZE,
        borderRadius: MIC_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
    },
    micButtonRecording: {
        backgroundColor: theme.error,
    },
});
