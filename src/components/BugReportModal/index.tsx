import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles, Theme, CommonStyles } from '@/contexts/ThemeContext';
import { submitBugReport, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, MAX_EMAIL_LENGTH } from '@/services/bugReport';
import { SPACING } from '@/theme';

interface BugReportModalProps {
    visible: boolean;
    screenRef: React.MutableRefObject<string>;
    onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ visible, screenRef, onClose }) => {
    const { t, i18n } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { user, userProfile } = useAuth();
    const { settings } = useSettings();
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Fill in the account's name/e-mail on open, without overwriting what the user typed
    useEffect(() => {
        if (!visible) return;
        setIsSuccess(false);
        setError('');
        if (user) {
            setName(prev => prev || userProfile?.displayName || user.displayName || '');
            setEmail(prev => prev || user.email || '');
        }
    }, [visible, user, userProfile]);

    const handleSubmit = async () => {
        if (!message.trim()) {
            setError(t('bugReport.messageRequired'));
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await submitBugReport({
                message,
                name,
                email,
                uid: user?.uid ?? null,
                screen: screenRef.current,
                language: i18n.language,
                settings,
            });
            setMessage('');
            setIsSuccess(true);
        } catch (e) {
            console.error('Error submitting bug report:', e);
            setError(t('bugReport.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={common.pickerOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={common.modalContainerCentered}>
                    <View style={common.pickerHeader}>
                        <Text style={common.pickerHeaderTitle}>{t('bugReport.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {isSuccess ? (
                        <View style={styles.body}>
                            <Text style={[common.textStrong, common.textCenter, common.mbSm]}>{t('bugReport.successTitle')}</Text>
                            <Text style={[common.subtitle, common.textCenter, common.mbLg]}>{t('bugReport.successMessage')}</Text>
                            <AppButton title={t('bugReport.close')} onPress={onClose} />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                            <Text style={[common.smallText, common.mbMd]}>{t('bugReport.intro')}</Text>

                            <Text style={[common.sectionLabel, common.mbXs]}>{t('bugReport.messageLabel')}</Text>
                            <TextInput
                                style={[styles.input, styles.messageInput]}
                                placeholder={t('bugReport.messagePlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                value={message}
                                maxLength={MAX_MESSAGE_LENGTH}
                                onChangeText={text => { setMessage(text); if (error) setError(''); }}
                            />

                            <Text style={[common.sectionLabel, common.mbXs]}>{t('bugReport.nameLabel')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('bugReport.namePlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={name}
                                maxLength={MAX_NAME_LENGTH}
                                onChangeText={setName}
                            />

                            <Text style={[common.sectionLabel, common.mbXs]}>{t('bugReport.emailLabel')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('bugReport.emailPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={email}
                                maxLength={MAX_EMAIL_LENGTH}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <Text style={[common.footerText, common.mbMd]}>{t('bugReport.attachedInfo')}</Text>
                            {!!error && <Text style={styles.errorText}>{error}</Text>}

                            <AppButton
                                title={t('bugReport.submit')}
                                onPress={handleSubmit}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            />
                        </ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    body: {
        padding: SPACING.md,
    },
    input: {
        ...common.input,
        backgroundColor: theme.background,
        marginBottom: SPACING.md,
    },
    messageInput: {
        ...common.textArea,
        height: 120,
    },
    errorText: {
        ...common.smallText,
        color: theme.error,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
});
