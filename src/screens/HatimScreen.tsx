import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
    SafeAreaView,
    Platform,
    Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { HatimService } from '../services/HatimService';
import { Hatim } from '../types';
import { SPACING, FONT_SIZES } from '../theme';
import { AppHeader } from '../components/AppHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/Badge';
import { LoadingView } from '../components/LoadingView';
import { createStyles } from './HatimScreen.styles';

interface HatimScreenProps {
    navigation: any;
}

export const HatimScreen: React.FC<HatimScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { user } = useAuth();
    const [hatims, setHatims] = useState<Hatim[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDeadline, setNewDeadline] = useState<Date | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [creating, setCreating] = useState(false);
    const [hasDeadline, setHasDeadline] = useState(false);

    const fetchHatims = async () => {
        try {
            setLoading(true);
            const data = await HatimService.getHatims(user?.uid);
            setHatims(data);
        } catch (error) {
            console.error('Error fetching hatims:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHatims();
    }, [user?.uid]);

    const handleCreate = async () => {
        if (!newTitle.trim() || !user) return;
        try {
            setCreating(true);
            const deadline = hasDeadline && newDeadline ? newDeadline.getTime() : undefined;
            await HatimService.createHatim(newTitle, newDesc, user.uid, user.displayName || t('profileScreen.defaultUserName'), deadline, isPrivate);
            setNewTitle('');
            setNewDesc('');
            setNewDeadline(null);
            setIsPrivate(false);
            setModalVisible(false);
            setHasDeadline(false);
            fetchHatims();
        } catch (error) {
            console.error('Error creating hatim:', error);
        } finally {
            setCreating(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const currentDeadline = newDeadline || new Date();
            currentDeadline.setFullYear(selectedDate.getFullYear());
            currentDeadline.setMonth(selectedDate.getMonth());
            currentDeadline.setDate(selectedDate.getDate());
            setNewDeadline(new Date(currentDeadline));
            if (Platform.OS !== 'ios') setShowTimePicker(true);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const currentDeadline = newDeadline || new Date();
            currentDeadline.setHours(selectedTime.getHours());
            currentDeadline.setMinutes(selectedTime.getMinutes());
            setNewDeadline(new Date(currentDeadline));
        }
    };

    const renderHatimItem = ({ item }: { item: Hatim }) => {
        const completedParts = item.parts.filter(p => p.isCompleted).length;
        const progress = (completedParts / 30) * 100;

        return (
            <TouchableOpacity
                style={styles.hatimCard}
                onPress={() => navigation.navigate('HatimDetail', { hatimId: item.id })}
            >
                <View style={styles.hatimHeader}>
                    <Text style={styles.hatimTitle} numberOfLines={1}>
                        {item.title}
                        {item.isPrivate && <Text style={styles.privateLabel}>{t('hatimScreen.private')}</Text>}
                    </Text>
                    {item.isCompleted ? (
                        <Badge label={t('hatimScreen.completed')} color="#2E7D32" size="small" />
                    ) : item.isLocked ? (
                        <Badge label={t('hatimScreen.locked')} color="#607D8B" size="small" />
                    ) : null}
                </View>
                <Text style={styles.hatimCreator}>
                    {t('hatimScreen.creator', { name: item.creatorName })}
                </Text>
                <View style={styles.progressContainer}>
                    <ProgressBar progress={progress} style={styles.progressBar} />
                    <Text style={styles.progressText}>
                        {t('hatimScreen.juzProgress', { count: completedParts })}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.hatim')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            {loading ? (
                <LoadingView />
            ) : (
                <View style={styles.listWrapper}>
                    <FlatList
                        data={hatims}
                        renderItem={renderHatimItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, styles.emptyTextSecondary]}>
                                    {t('hatimScreen.empty')}
                                </Text>
                            </View>
                        }
                    />
                </View>
            )}

            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('hatimScreen.createTitle')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('hatimScreen.titlePlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('hatimScreen.descriptionPlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={newDesc}
                            onChangeText={setNewDesc}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, styles.inputLabelNoMargin]}>{t('hatimScreen.setDeadline')}</Text>
                            <Switch
                                value={hasDeadline}
                                onValueChange={setHasDeadline}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={hasDeadline ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, styles.inputLabelNoMargin]}>{t('hatimScreen.privateHatim')}</Text>
                            <Switch
                                value={isPrivate}
                                onValueChange={setIsPrivate}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={isPrivate ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        {hasDeadline && (
                            <>
                                <Text style={[styles.inputLabel, styles.inputLabelSecondary]}>{t('hatimScreen.deadlineLabel')}</Text>

                                {Platform.OS === 'web' ? (
                                    <View style={styles.webDateWrapper}>
                                        <input
                                            type="date"
                                            style={styles.webDateInput}
                                            onChange={(e: any) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                const [y, m, d] = val.split('-').map(Number);
                                                const current = newDeadline || new Date();
                                                current.setFullYear(y);
                                                current.setMonth(m - 1);
                                                current.setDate(d);
                                                setNewDeadline(new Date(current));
                                            }}
                                            value={newDeadline ? newDeadline.toISOString().split('T')[0] : ''}
                                        />
                                        <View style={styles.row}>
                                            <select
                                                style={styles.webSelect}
                                                onChange={(e: any) => {
                                                    const h = parseInt(e.target.value);
                                                    const current = newDeadline || new Date();
                                                    current.setHours(h);
                                                    setNewDeadline(new Date(current));
                                                }}
                                                value={newDeadline ? newDeadline.getHours() : 0}
                                            >
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <Text style={styles.timeSeparator}>:</Text>
                                            <select
                                                style={styles.webSelect}
                                                onChange={(e: any) => {
                                                    const m = parseInt(e.target.value);
                                                    const current = newDeadline || new Date();
                                                    current.setMinutes(m);
                                                    setNewDeadline(new Date(current));
                                                }}
                                                value={newDeadline ? newDeadline.getMinutes() : 0}
                                            >
                                                {Array.from({ length: 60 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.input, styles.dateTimeButton]}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Text style={{ color: newDeadline ? theme.text : theme.textSecondary }}>
                                                {newDeadline
                                                    ? newDeadline.toLocaleString(i18n.language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                    : t('hatimScreen.selectDateTime')}
                                            </Text>
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={newDeadline || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                                onChange={onDateChange}
                                                minimumDate={new Date()}
                                                is24Hour={true}
                                                locale={i18n.language === 'en' ? 'en-US' : 'tr-TR'}
                                            />
                                        )}

                                        {showTimePicker && (
                                            <DateTimePicker
                                                value={newDeadline || new Date()}
                                                mode="time"
                                                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                                onChange={onTimeChange}
                                                is24Hour={true}
                                                locale={i18n.language === 'en' ? 'en-US' : 'tr-TR'}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('hatimScreen.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={handleCreate}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.whiteText}>{t('hatimScreen.create')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};


