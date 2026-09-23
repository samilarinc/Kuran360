import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';
import { Link2, Inbox, HandHeart } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ChecklistItem } from '@/components/ChecklistItem';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { DuaRequest } from '@/types';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

declare const navigator: any;


interface DuaListScreenProps {
    onNavigate: () => void;
}

export const DuaListScreen: React.FC<DuaListScreenProps> = ({ onNavigate }) => {
    const { theme, common } = useTheme();
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

    const styles = useThemedStyles(createStyles);

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.duaList')}
                showBackButton={true}
                onBackPress={onNavigate}
                showHomeButton={true}
                onHomePress={onNavigate}
            />
            <ScrollView style={common.content}>
                {/* Compact Request Link Section */}
                <View style={[common.sectionCardCompact, common.rowBetween, common.mbLg]}>
                    <View style={[common.rowFill, common.gapSm]}>
                        <Link2 size={16} color={theme.text} />
                        <Text style={common.textStrong}>{t('duaListScreen.shareBoxText')}</Text>
                    </View>
                    <AppButton
                        title={t('duaListScreen.copy')}
                        onPress={copyRequestLink}
                        variant="primary"
                        size="small"
                    />
                </View>

                {/* Pending Requests Section */}
                {duaRequests.length > 0 && (
                    <View style={common.mbXl}>
                        <View style={[common.rowGap, common.mbSm]}>
                            <Inbox size={18} color={theme.text} />
                            <Text style={[common.title, common.mb0]}>
                                {t('duaListScreen.newRequests', { count: duaRequests.length })}
                            </Text>
                        </View>
                        {duaRequests.map(request => (
                            <View
                                key={request.id}
                                style={[common.sectionCardCompact, common.mbSm]}
                            >
                                <View style={common.mbMd}>
                                    <Text style={common.textAccent}>
                                        {request.requesterName}
                                    </Text>
                                    <Text style={common.text}>
                                        {request.topic}
                                    </Text>
                                </View>
                                <View style={common.rowGap}>
                                    <AppButton
                                        title={t('duaListScreen.accept')}
                                        onPress={() => handleAcceptRequest(request)}
                                        variant="primary"
                                        size="small"
                                        style={common.flex1}
                                    />
                                    <AppButton
                                        title={t('duaListScreen.giveUp')}
                                        onPress={() => handleRejectRequest(request)}
                                        variant="outline"
                                        size="small"
                                        style={[common.flex1, { borderColor: theme.textSecondary }]}
                                        textStyle={{ color: theme.textSecondary }}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Personal Duas Section */}
                <View style={common.mbXl}>
                    <View style={[common.rowBetween, common.mbMd]}>
                        <View style={common.rowGap}>
                            <HandHeart size={18} color={theme.text} />
                            <Text style={[common.title, common.mb0]}>
                                {t('duaListScreen.personalTitle')}
                            </Text>
                        </View>
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
                        <View style={[common.sectionCardCompact, common.mbMd]}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('duaListScreen.personalTopicPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <AppButton
                                title={t('duaListScreen.add')}
                                onPress={() => handleAddDua(true)}
                                variant="primary"
                                size="medium"
                            />
                        </View>
                    )}

                    {personalDuas.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {t('duaListScreen.noPersonalDuas')}
                        </Text>
                    ) : (
                        personalDuas.map(dua => (
                            <ChecklistItem
                                key={dua.id}
                                checked={dua.isChecked}
                                onToggle={() => toggleCheck(dua.id, dua.isChecked)}
                                trailing={
                                    <TouchableOpacity
                                        onPress={() => handleDeleteDua(dua.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={common.subtitle}>×</Text>
                                    </TouchableOpacity>
                                }
                            >
                                <Text style={[
                                    common.text,
                                    dua.isChecked && common.checkedText
                                ]}>
                                    {dua.topic}
                                </Text>
                            </ChecklistItem>
                        ))
                    )}
                </View>

                {/* Others Duas Section */}
                <View style={common.mbXl}>
                    <View style={[common.rowBetween, common.mbMd]}>
                        <Text style={[common.title, common.mbSm]}>
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
                        <View style={[common.sectionCardCompact, common.mbMd]}>
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
                            <AppButton
                                title={t('duaListScreen.add')}
                                onPress={() => handleAddDua(false)}
                                variant="primary"
                                size="medium"
                            />
                        </View>
                    )}

                    {othersDuas.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {t('duaListScreen.noOthersDuas')}
                        </Text>
                    ) : (
                        othersDuas.map(dua => (
                            <ChecklistItem
                                key={dua.id}
                                checked={dua.isChecked}
                                onToggle={() => toggleCheck(dua.id, dua.isChecked)}
                                trailing={
                                    <TouchableOpacity
                                        onPress={() => handleDeleteDua(dua.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={common.subtitle}>×</Text>
                                    </TouchableOpacity>
                                }
                            >
                                <View style={common.flex1}>
                                    <Text style={styles.duaPerson}>
                                        {dua.person}
                                    </Text>
                                    <Text style={[
                                        common.text,
                                        dua.isChecked && common.checkedText
                                    ]}>
                                        {dua.topic}
                                    </Text>
                                </View>
                            </ChecklistItem>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        addButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.primary,
        },
        addButtonText: {
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 'bold',
        },
        input: {
            ...common.input,
            borderRadius: 8,
            marginBottom: SPACING.sm,
            backgroundColor: theme.background,
            fontSize: FONT_SIZES.medium,
        },
        emptyText: {
            ...common.emptyStateText,
            marginVertical: SPACING.lg,
        },
        duaPerson: {
            fontSize: FONT_SIZES.large,
            fontWeight: 'bold',
            marginBottom: 2,
            color: theme.primary,
        },
        deleteButton: {
            padding: SPACING.sm,
        },
    });
};
