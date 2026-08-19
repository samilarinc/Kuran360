import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useUserData } from '../contexts/UserDataContext';
import { useAuth } from '../contexts/AuthContext';
import { DuaRequest } from '../types';
import { createStyles } from './DuaListScreen.styles';

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
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.duaList')}
                showBackButton={true}
                onBackPress={onNavigate}
            />
            <ScrollView style={styles.content}>
                {/* Compact Request Link Section */}
                <View style={styles.compactShareBox}>
                    <Text style={styles.compactShareText}>{t('duaListScreen.shareBoxText')}</Text>
                    <TouchableOpacity
                        style={styles.compactCopyButton}
                        onPress={copyRequestLink}
                    >
                        <Text style={styles.compactCopyButtonText}>{t('duaListScreen.copy')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Pending Requests Section */}
                {duaRequests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('duaListScreen.newRequests', { count: duaRequests.length })}
                        </Text>
                        {duaRequests.map(request => (
                            <View
                                key={request.id}
                                style={styles.requestItem}
                            >
                                <View style={styles.requestContent}>
                                    <Text style={styles.requestName}>
                                        {request.requesterName}
                                    </Text>
                                    <Text style={styles.requestTopic}>
                                        {request.topic}
                                    </Text>
                                </View>
                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.actionButtonAccept]}
                                        onPress={() => handleAcceptRequest(request)}
                                    >
                                        <Text style={styles.actionButtonText}>{t('duaListScreen.accept')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.actionButtonReject]}
                                        onPress={() => handleRejectRequest(request)}
                                    >
                                        <Text style={[styles.actionButtonText, styles.actionButtonTextReject]}>{t('duaListScreen.giveUp')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Personal Duas Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {t('duaListScreen.personalTitle')}
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowPersonalForm(!showPersonalForm)}
                        >
                            <Text style={styles.addButtonText}>
                                {showPersonalForm ? '−' : '+'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showPersonalForm && (
                        <View style={styles.form}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('duaListScreen.personalTopicPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={() => handleAddDua(true)}
                            >
                                <Text style={styles.submitButtonText}>{t('duaListScreen.add')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {personalDuas.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {t('duaListScreen.noPersonalDuas')}
                        </Text>
                    ) : (
                        personalDuas.map(dua => (
                            <View
                                key={dua.id}
                                style={styles.duaItem}
                            >
                                <TouchableOpacity
                                    style={styles.duaContent}
                                    onPress={() => toggleCheck(dua.id, dua.isChecked)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        dua.isChecked && styles.checkboxChecked
                                    ]}>
                                        {dua.isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={[
                                        styles.duaText,
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
                        <Text style={styles.sectionTitle}>
                            {t('duaListScreen.othersTitle')}
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowOthersForm(!showOthersForm)}
                        >
                            <Text style={styles.addButtonText}>
                                {showOthersForm ? '−' : '+'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showOthersForm && (
                        <View style={styles.form}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('duaListScreen.personPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newPerson}
                                onChangeText={setNewPerson}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('duaListScreen.othersTopicPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={() => handleAddDua(false)}
                            >
                                <Text style={styles.submitButtonText}>{t('duaListScreen.add')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {othersDuas.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {t('duaListScreen.noOthersDuas')}
                        </Text>
                    ) : (
                        othersDuas.map(dua => (
                            <View
                                key={dua.id}
                                style={styles.duaItem}
                            >
                                <TouchableOpacity
                                    style={styles.duaContent}
                                    onPress={() => toggleCheck(dua.id, dua.isChecked)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        dua.isChecked && styles.checkboxChecked
                                    ]}>
                                        {dua.isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <View style={styles.duaTextContainer}>
                                        <Text style={styles.duaPerson}>
                                            {dua.person}
                                        </Text>
                                        <Text style={[
                                            styles.duaText,
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

