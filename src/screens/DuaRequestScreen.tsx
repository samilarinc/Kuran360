import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { AppButton } from '../components/AppButton';
import { LoadingView } from '../components/LoadingView';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { createStyles } from './DuaRequestScreen.styles';

interface DuaRequestScreenProps {
    navigation: any;
    userId: string;
}

export const DuaRequestScreen: React.FC<DuaRequestScreenProps> = ({ navigation, userId }) => {
    const { theme } = useTheme();
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
    }, [userId]);

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

    const styles = useMemo(() => createStyles(theme), [theme]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingView />
            </SafeAreaView>
        );
    }

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={styles.successTitle}>{t('duaRequestScreen.successTitle')}</Text>
                    <Text style={styles.successText}>
                        {t('duaRequestScreen.successMessage', { name: targetUserName })}
                    </Text>
                    <AppButton
                        title={t('duaRequestScreen.backHome')}
                        onPress={() => navigation.navigate('Main')}
                        variant="primary"
                        size="large"
                        style={{ borderRadius: 12 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.duaRequest')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />
            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        {t('duaRequestScreen.sendingToPrefix') ? `${t('duaRequestScreen.sendingToPrefix')} ` : ''}
                        <Text style={styles.infoTextTargetName}>{targetUserName}</Text> {t('duaRequestScreen.sendingToSuffix')}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('duaRequestScreen.nameLabel')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('duaRequestScreen.namePlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={requesterName}
                            onChangeText={setRequesterName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('duaRequestScreen.topicLabel')}</Text>
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
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('duaRequestScreen.submit')}</Text>
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
