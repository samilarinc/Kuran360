import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface DuaRequestScreenProps {
    navigation: any;
    userId: string;
}

export const DuaRequestScreen: React.FC<DuaRequestScreenProps> = ({ navigation, userId }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const [targetUserName, setTargetUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [requesterName, setRequesterName] = useState('');
    const [topic, setTopic] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const fetchTargetUser = async () => {
            try {
                const profileRef = doc(db, 'users', userId, 'profile', 'public');
                const profileDoc = await getDoc(profileRef);
                if (profileDoc.exists()) {
                    setTargetUserName(profileDoc.data().displayName);
                } else {
                    setTargetUserName(t('duaRequestScreen.unknownUser'));
                }
            } catch (error) {
                console.error('Error fetching target user:', error);
                setTargetUserName(t('duaRequestScreen.unknownUser'));
            } finally {
                setLoading(false);
            }
        };


        fetchTargetUser();
    }, [userId, t]);

    const handleSubmit = async () => {
        if (!requesterName.trim() || !topic.trim()) {
            Alert.alert(t('duaRequestScreen.errorTitle'), t('duaRequestScreen.fillAllFields'));
            return;
        }

        setIsSubmitting(true);
        try {
            const requestsRef = collection(db, 'users', userId, 'duaRequests');
            await addDoc(requestsRef, {
                requesterName: requesterName.trim(),
                topic: topic.trim(),
                status: 'pending',
                createdAt: Date.now(),
            });
            setIsSuccess(true);
        } catch (error) {
            console.error('Error submitting dua request:', error);
            Alert.alert(t('duaRequestScreen.errorTitle'), t('duaRequestScreen.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = useThemedStyles(createStyles);

    if (loading) {
        return (
            <SafeAreaView style={common.container}>
                <LoadingView />
            </SafeAreaView>
        );
    }

    if (isSuccess) {
        return (
            <SafeAreaView style={common.container}>
                <View style={common.emptyState}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={[common.titleLarge, common.mbMd]}>{t('duaRequestScreen.successTitle')}</Text>
                    <Text style={styles.successText}>
                        {t('duaRequestScreen.successMessage', { name: targetUserName })}
                    </Text>
                    <AppButton
                        title={t('duaRequestScreen.backHome')}
                        onPress={() => navigation.navigate('Main')}
                        variant="primary"
                        size="large"
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.duaRequest')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />
            <ScrollView style={common.content}>
                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        {t('duaRequestScreen.sendingToPrefix') ? `${t('duaRequestScreen.sendingToPrefix')} ` : ''}
                        <Text style={common.textAccent}>{targetUserName}</Text> {t('duaRequestScreen.sendingToSuffix')}
                    </Text>

                    <View style={common.mbLg}>
                        <Text style={[common.sectionLabel, common.mbXs]}>{t('duaRequestScreen.nameLabel')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('duaRequestScreen.namePlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={requesterName}
                            onChangeText={setRequesterName}
                        />
                    </View>

                    <View style={common.mbLg}>
                        <Text style={[common.sectionLabel, common.mbXs]}>{t('duaRequestScreen.topicLabel')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('duaRequestScreen.topicPlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={topic}
                            onChangeText={setTopic}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && common.disabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={[common.textStrong, common.buttonTextPrimary]}>{t('duaRequestScreen.submit')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                    {t('duaRequestScreen.footer')}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        card: {
            ...common.infoCard,
            marginTop: SPACING.md,
            backgroundColor: theme.surface,
        },
        infoText: {
            ...common.text,
            marginBottom: SPACING.xl,
            textAlign: 'center',
            lineHeight: 24,
        },
        input: {
            ...common.input,
            backgroundColor: theme.background,
            marginBottom: 0,
            fontSize: FONT_SIZES.medium,
        },
        textArea: {
            height: 120,
            textAlignVertical: 'top',
        },
        submitButton: {
            borderRadius: 12,
            padding: SPACING.lg,
            alignItems: 'center',
            marginTop: SPACING.md,
            backgroundColor: theme.primary,
        },
        footerText: {
            ...common.footerText,
            marginTop: SPACING.xl,
        },
        successIcon: {
            fontSize: 64,
            marginBottom: SPACING.lg,
        },
        successText: {
            ...common.subtitle,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: SPACING.xl,
        },
    });
};
