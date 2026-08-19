import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (isSuccess) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.centerContainer}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={[styles.successTitle, { color: theme.text }]}>{t('duaRequestScreen.successTitle')}</Text>
                    <Text style={[styles.successText, { color: theme.textSecondary }]}>
                        {t('duaRequestScreen.successMessage', { name: targetUserName })}
                    </Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('Main')}
                    >
                        <Text style={styles.backButtonText}>{t('duaRequestScreen.backHome')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title={t('screenTitles.duaRequest')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView style={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.infoText, { color: theme.text }]}>
                        {t('duaRequestScreen.sendingToPrefix') ? `${t('duaRequestScreen.sendingToPrefix')} ` : ''}
                        <Text style={{ fontWeight: 'bold', color: theme.primary }}>{targetUserName}</Text> {t('duaRequestScreen.sendingToSuffix')}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('duaRequestScreen.nameLabel')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                            placeholder={t('duaRequestScreen.namePlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={requesterName}
                            onChangeText={setRequesterName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('duaRequestScreen.topicLabel')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                            placeholder={t('duaRequestScreen.topicPlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={topic}
                            onChangeText={setTopic}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.primary }, isSubmitting && { opacity: 0.7 }]}
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

                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    {t('duaRequestScreen.footer')}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    card: {
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: SPACING.md,
    },
    infoText: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.xl,
        textAlign: 'center',
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
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
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        marginTop: SPACING.xl,
        fontStyle: 'italic',
    },
    successIcon: {
        fontSize: 64,
        marginBottom: SPACING.lg,
    },
    successTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
    },
    successText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    backButton: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
});
