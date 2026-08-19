import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';
import { useUserData } from '../contexts/UserDataContext';
import { useAuth } from '../contexts/AuthContext';
import { DuaRequest } from '../types';

declare const navigator: any;


interface DuaListScreenProps {
    onNavigate: () => void;
}

export const DuaListScreen: React.FC<DuaListScreenProps> = ({ onNavigate }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { user } = useAuth();
    const {
        duaList,
        duaRequests,
        addDua,
        updateDua,
        deleteDua,
        acceptDuaRequest,
        rejectDuaRequest
    } = useUserData();

    const [newPerson, setNewPerson] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [showPersonalForm, setShowPersonalForm] = useState(false);
    const [showOthersForm, setShowOthersForm] = useState(false);

    const handleAddDua = (isPersonal: boolean) => {
        if (newTopic.trim() === '') {
            Alert.alert(t('duaListScreen.errorTitle'), t('duaListScreen.topicRequired'));
            return;
        }

        if (!isPersonal && newPerson.trim() === '') {
            Alert.alert(t('duaListScreen.errorTitle'), t('duaListScreen.nameRequired'));
            return;
        }

        addDua(isPersonal ? '' : newPerson.trim(), newTopic.trim(), isPersonal);
        setNewPerson('');
        setNewTopic('');
        setShowPersonalForm(false);
        setShowOthersForm(false);
    };

    const toggleCheck = (id: string, isChecked: boolean) => {
        updateDua(id, { isChecked: !isChecked });
    };

    const handleDeleteDua = (id: string) => {
        if (Platform.OS === 'web') {
            const confirmed = (globalThis as any).confirm?.(t('duaListScreen.deleteConfirm'));
            if (confirmed) deleteDua(id);
            return;
        }
        Alert.alert(
            t('duaListScreen.deleteTitle'),
            t('duaListScreen.deleteConfirm'),
            [
                { text: t('duaListScreen.cancel'), style: 'cancel' },
                {
                    text: t('duaListScreen.delete'),
                    style: 'destructive',
                    onPress: () => deleteDua(id),
                },
            ]
        );
    };

    const copyRequestLink = () => {
        if (!user) {
            Alert.alert(t('duaListScreen.errorTitle'), t('duaListScreen.signInToShare'));
            return;
        }
        const link = `https://kuran360.com/dua-request/${user.uid}`;

        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(link);
            Alert.alert(t('duaListScreen.linkCopiedTitle'), t('duaListScreen.linkCopiedMessage'));
        } else {
            Alert.alert(
                t('duaListScreen.shareLinkTitle'),
                t('duaListScreen.shareLinkMessage', { link }),
                [{ text: t('duaListScreen.ok') }]
            );
        }
    };


    const handleAcceptRequest = (request: DuaRequest) => {
        acceptDuaRequest(request);
    };

    const handleRejectRequest = (request: DuaRequest) => {
        if (Platform.OS === 'web') {
            const confirmed = (globalThis as any).confirm?.(t('duaListScreen.rejectConfirm'));
            if (confirmed) rejectDuaRequest(request.id);
            return;
        }
        Alert.alert(
            t('duaListScreen.rejectTitle'),
            t('duaListScreen.rejectConfirm'),
            [
                { text: t('duaListScreen.giveUp'), style: 'cancel' },
                {
                    text: t('duaListScreen.reject'),
                    style: 'destructive',
                    onPress: () => rejectDuaRequest(request.id),
                },
            ]
        );
    };

    const personalDuas = duaList.filter(d => d.isPersonal);
    const othersDuas = duaList.filter(d => !d.isPersonal);

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title={t('screenTitles.duaList')}
                showBackButton={true}
                onBackPress={onNavigate}
            />
            <ScrollView style={styles.content}>
                {/* Compact Request Link Section */}
                <View style={[styles.compactShareBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.compactShareText, { color: theme.text }]}>{t('duaListScreen.shareBoxText')}</Text>
                    <TouchableOpacity
                        style={[styles.compactCopyButton, { backgroundColor: theme.primary }]}
                        onPress={copyRequestLink}
                    >
                        <Text style={styles.compactCopyButtonText}>{t('duaListScreen.copy')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Pending Requests Section */}
                {duaRequests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('duaListScreen.newRequests', { count: duaRequests.length })}
                        </Text>
                        {duaRequests.map(request => (
                            <View
                                key={request.id}
                                style={[styles.requestItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            >
                                <View style={styles.requestContent}>
                                    <Text style={[styles.requestName, { color: theme.primary }]}>
                                        {request.requesterName}
                                    </Text>
                                    <Text style={[styles.requestTopic, { color: theme.text }]}>
                                        {request.topic}
                                    </Text>
                                </View>
                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                        onPress={() => handleAcceptRequest(request)}
                                    >
                                        <Text style={styles.actionButtonText}>{t('duaListScreen.accept')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.textSecondary }]}
                                        onPress={() => handleRejectRequest(request)}
                                    >
                                        <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>{t('duaListScreen.giveUp')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Personal Duas Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('duaListScreen.personalTitle')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowPersonalForm(!showPersonalForm)}
                        >
                            <Text style={styles.addButtonText}>
                                {showPersonalForm ? '−' : '+'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showPersonalForm && (
                        <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder={t('duaListScreen.personalTopicPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                                onPress={() => handleAddDua(true)}
                            >
                                <Text style={styles.submitButtonText}>{t('duaListScreen.add')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {personalDuas.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            {t('duaListScreen.noPersonalDuas')}
                        </Text>
                    ) : (
                        personalDuas.map(dua => (
                            <View
                                key={dua.id}
                                style={[styles.duaItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                            >
                                <TouchableOpacity
                                    style={styles.duaContent}
                                    onPress={() => toggleCheck(dua.id, dua.isChecked)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        { borderColor: theme.border },
                                        dua.isChecked && { backgroundColor: theme.primary }
                                    ]}>
                                        {dua.isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={[
                                        styles.duaText,
                                        { color: theme.text },
                                        dua.isChecked && styles.checkedText
                                    ]}>
                                        {dua.topic}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDeleteDua(dua.id)}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.deleteIcon}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Others Duas Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {t('duaListScreen.othersTitle')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowOthersForm(!showOthersForm)}
                        >
                            <Text style={styles.addButtonText}>
                                {showOthersForm ? '−' : '+'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showOthersForm && (
                        <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder={t('duaListScreen.personPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newPerson}
                                onChangeText={setNewPerson}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder={t('duaListScreen.othersTopicPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                                onPress={() => handleAddDua(false)}
                            >
                                <Text style={styles.submitButtonText}>{t('duaListScreen.add')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {othersDuas.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            {t('duaListScreen.noOthersDuas')}
                        </Text>
                    ) : (
                        othersDuas.map(dua => (
                            <View
                                key={dua.id}
                                style={[styles.duaItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                            >
                                <TouchableOpacity
                                    style={styles.duaContent}
                                    onPress={() => toggleCheck(dua.id, dua.isChecked)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        { borderColor: theme.border },
                                        dua.isChecked && { backgroundColor: theme.primary }
                                    ]}>
                                        {dua.isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <View style={styles.duaTextContainer}>
                                        <Text style={[styles.duaPerson, { color: theme.primary }]}>
                                            {dua.person}
                                        </Text>
                                        <Text style={[
                                            styles.duaText,
                                            { color: theme.text },
                                            dua.isChecked && styles.checkedText
                                        ]}>
                                            {dua.topic}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDeleteDua(dua.id)}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.deleteIcon}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: SPACING.sm,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
        borderWidth: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZES.medium,
    },
    submitButton: {
        borderRadius: 8,
        padding: SPACING.md,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: SPACING.lg,
    },
    duaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
    },
    duaContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    duaTextContainer: {
        flex: 1,
    },
    duaPerson: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    duaText: {
        fontSize: FONT_SIZES.medium,
    },
    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    deleteButton: {
        padding: SPACING.sm,
    },
    deleteIcon: {
        fontSize: 18,
        color: '#666',
    },
    compactShareBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.lg,
    },
    compactShareText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    compactCopyButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    compactCopyButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.small,
    },
    requestItem: {


        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.sm,
    },
    requestContent: {
        marginBottom: SPACING.md,
    },
    requestName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    requestTopic: {
        fontSize: FONT_SIZES.medium,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        padding: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.small,
    },
});

