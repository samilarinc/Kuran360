import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    Alert,
    useWindowDimensions,
    Modal,
    TextInput,
    Platform,
    Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { HatimService } from '../services/HatimService';
import { Hatim, HatimPart } from '../types';
import { SPACING, FONT_SIZES } from '../constants';
import { AppHeader } from '../components/AppHeader';
import { AppButton } from '../components/AppButton';
import { ProgressBar } from '../components/ProgressBar';
import { createStyles } from './HatimDetailScreen.styles';

interface HatimDetailScreenProps {
    navigation: any;
    route: { params: { hatimId: string } };
}

export const HatimDetailScreen: React.FC<HatimDetailScreenProps> = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { hatimId } = route.params;
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [hatim, setHatim] = useState<Hatim | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedPart, setSelectedPart] = useState<HatimPart | null>(null);
    const [partModalVisible, setPartModalVisible] = useState(false);
    const [localPages, setLocalPages] = useState<number>(0);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editDeadline, setEditDeadline] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasDeadline, setHasDeadline] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Responsive grid calculations
    const containerPadding = SPACING.lg * 2;
    const scrollbarBuffer = width > 1000 ? 20 : 0; // Account for scrollbar on desktop
    const availableWidth = Math.min(width, 1200) - containerPadding - scrollbarBuffer; // Max width reduced for better focus
    const numColumns = width < 450 ? 2 : width < 768 ? 4 : width < 1024 ? 6 : 8;
    const partItemWidth = Math.floor((availableWidth / numColumns) - SPACING.md);

    // Responsive font sizes
    const numberFontSize = width < 450 ? 22 : 28;
    const claimantFontSize = width < 450 ? 12 : 14;

    const fetchHatim = useCallback(async () => {
        try {
            setLoading(true);
            const data = await HatimService.getHatimById(hatimId);
            setHatim(data);
        } catch (error) {
            console.error('Error fetching hatim detail:', error);
            Alert.alert(t('hatimDetailScreen.loadErrorTitle'), t('hatimDetailScreen.loadErrorMessage'));
        } finally {
            setLoading(false);
        }
    }, [hatimId]);

    useEffect(() => {
        fetchHatim().then(() => {
            if (user && hatimId) {
                HatimService.syncUserName(hatimId, user.uid, user.displayName || t('profileScreen.defaultUserName'));
            }
        });
    }, [fetchHatim, user?.uid, user?.displayName]);

    const calculateTimeLeft = useCallback(() => {
        if (!hatim?.deadline) return;
        const now = Date.now();
        const difference = hatim.deadline - now;

        if (difference <= 0) {
            setTimeLeft(t('hatimDetailScreen.timeUp'));
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);

        let res = '';
        if (days > 0) res += t('hatimDetailScreen.days', { count: days });
        if (hours > 0) res += t('hatimDetailScreen.hours', { count: hours });
        res += t('hatimDetailScreen.minutes', { count: minutes });
        setTimeLeft(res);
    }, [hatim?.deadline]);

    useEffect(() => {
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    const handlePartPress = (part: HatimPart) => {
        if (hatim?.isLocked) {
            if (Platform.OS === 'web') {
                (globalThis as any).alert?.(t('hatimDetailScreen.lockedMessage'));
            } else {
                Alert.alert(t('hatimDetailScreen.lockedTitle'), t('hatimDetailScreen.lockedMessage'));
            }
            return;
        }
        setSelectedPart(part);
        setLocalPages(part.pagesRead || 0);
        setPartModalVisible(true);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const handleClaim = async () => {
        if (!user || !hatim || !selectedPart) return;
        try {
            setActionLoading(selectedPart.partNumber);
            await HatimService.claimPart(hatimId, selectedPart.partNumber, user.uid, user.displayName || t('profileScreen.defaultUserName'));
            setPartModalVisible(false);
            await fetchHatim(); // Wait for fetch
        } catch (error: any) {
            Alert.alert(t('hatimDetailScreen.loadErrorTitle'), error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnclaim = async () => {
        if (!user || !hatim || !selectedPart) return;
        try {
            setActionLoading(selectedPart.partNumber);
            await HatimService.unclaimPart(hatimId, selectedPart.partNumber, user.uid);
            setPartModalVisible(false);
            await fetchHatim(); // Wait for fetch
        } catch (error: any) {
            Alert.alert(t('hatimDetailScreen.loadErrorTitle'), error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleCompletion = async () => {
        if (!user || !hatim || !selectedPart) return;
        try {
            setActionLoading(selectedPart.partNumber);
            const newCompleted = !selectedPart.isCompleted;
            const totalPages = selectedPart.totalPages || 20;

            // If marking as completed, also set pages to max
            // If marking as incomplete, keep pages as is (or reset if user wants, but usually keep)
            await HatimService.togglePartCompletion(hatimId, selectedPart.partNumber, user.uid, newCompleted);

            if (newCompleted) {
                await HatimService.updatePartProgress(hatimId, selectedPart.partNumber, user.uid, totalPages);
            }

            setPartModalVisible(false);
            await fetchHatim();
        } catch (error: any) {
            Alert.alert(t('hatimDetailScreen.loadErrorTitle'), error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdatePages = (pages: number) => {
        if (!user || !hatim || !selectedPart) return;
        const total = selectedPart.totalPages || 20;
        const validatedPages = Math.max(0, Math.min(total, pages));

        // Immediate UI feedback
        setLocalPages(validatedPages);

        // Debounce Firebase write
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await HatimService.updatePartProgress(hatimId, selectedPart.partNumber, user.uid, validatedPages);

                // Silent state refresh
                const updatedHatim = await HatimService.getHatimById(hatimId);
                if (updatedHatim) {
                    setHatim(updatedHatim);
                }
            } catch (error: any) {
                console.error('Error saving progress:', error);
            }
        }, 2000);
    };

    const [editIsPrivate, setEditIsPrivate] = useState(false);
    const [editIsLocked, setEditIsLocked] = useState(false);

    const openEditModal = () => {
        if (!hatim) return;
        setEditTitle(hatim.title);
        setEditDesc(hatim.description || '');
        setEditDeadline(hatim.deadline ? new Date(hatim.deadline) : null);
        setHasDeadline(!!hatim.deadline);
        setEditIsPrivate(hatim.isPrivate || false);
        setEditIsLocked(hatim.isLocked || false);
        setEditModalVisible(true);
    };

    const handleUpdateHatim = async () => {
        if (!hatim || !editTitle.trim()) return;
        try {
            setIsUpdating(true);
            await HatimService.updateHatim(hatimId, {
                title: editTitle,
                description: editDesc,
                deadline: hasDeadline && editDeadline ? editDeadline.getTime() : null,
                isPrivate: editIsPrivate,
                isLocked: editIsLocked
            });
            setEditModalVisible(false);
            await fetchHatim();
        } catch (error: any) {
            Alert.alert(t('hatimDetailScreen.loadErrorTitle'), t('hatimDetailScreen.updateErrorMessage'));
        } finally {
            setIsUpdating(false);
        }
    };



    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const currentDeadline = editDeadline || new Date();
            currentDeadline.setFullYear(selectedDate.getFullYear());
            currentDeadline.setMonth(selectedDate.getMonth());
            currentDeadline.setDate(selectedDate.getDate());
            setEditDeadline(new Date(currentDeadline));
            if (Platform.OS !== 'ios') setShowTimePicker(true);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const currentDeadline = editDeadline || new Date();
            currentDeadline.setHours(selectedTime.getHours());
            currentDeadline.setMinutes(selectedTime.getMinutes());
            setEditDeadline(new Date(currentDeadline));
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!hatim) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.notFoundText}>{t('hatimDetailScreen.notFound')}</Text>
                    <AppButton
                        title={t('hatimDetailScreen.goBack')}
                        onPress={() => navigation.goBack()}
                        variant="ghost"
                    />
                </View>
            </SafeAreaView>
        );
    }

    const completedCount = hatim.parts.filter(p => p.isCompleted).length;
    const claimedCount = hatim.parts.filter(p => p.claimedById).length;

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const handleDeleteHatim = async () => {
        if (Platform.OS === 'web') {
            if ((globalThis as any).confirm?.(t('hatimDetailScreen.deleteMessage'))) {
                try {
                    setIsUpdating(true);
                    await HatimService.deleteHatim(hatimId);
                    setEditModalVisible(false);
                    navigation.goBack();
                } catch (error) {
                    console.log(error);
                    (globalThis as any).alert?.(t('hatimDetailScreen.deleteErrorMessage'));
                    setIsUpdating(false);
                }
            }
            return;
        }

        Alert.alert(
            t('hatimDetailScreen.deleteTitle'),
            t('hatimDetailScreen.deleteMessage'),
            [
                { text: t('hatimDetailScreen.cancel'), style: 'cancel' },
                {
                    text: t('hatimDetailScreen.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsUpdating(true);
                            await HatimService.deleteHatim(hatimId);
                            setEditModalVisible(false);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t('hatimDetailScreen.loadErrorTitle'), t('hatimDetailScreen.deleteErrorMessage'));
                            setIsUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={hatim.title}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            >
                {hatim.creatorId === user?.uid && (
                    <AppButton
                        title={t('hatimDetailScreen.edit')}
                        onPress={openEditModal}
                        variant="translucent"
                        shape="pill"
                        size="small"
                        style={{ marginLeft: SPACING.xs }}
                    />
                )}
            </AppHeader>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ... existing stats ... */}
                <View style={styles.infoCard}>
                    <Text style={styles.description}>
                        {hatim.description || t('hatimDetailScreen.noDescription')}
                    </Text>
                    {hatim.deadline && (
                        <View style={styles.deadlineInfo}>
                            <Text style={styles.deadlineText}>
                                {t('hatimDetailScreen.deadline', { date: formatDate(hatim.deadline) })}
                            </Text>
                            <View style={styles.countdownBadge}>
                                <Text style={styles.countdownText}>
                                    {t('hatimDetailScreen.timeRemaining', { time: timeLeft })}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statColumn}>
                            <Text style={[styles.statValue, styles.statValueCompleted]}>{completedCount} / 30</Text>
                            <Text style={styles.statLabel}>{t('hatimDetailScreen.completedStat')}</Text>
                            <ProgressBar
                                progress={(completedCount / 30) * 100}
                                height={6}
                                fillColor="#4CAF50"
                                style={styles.miniProgressBarBackground}
                            />
                        </View>
                        <View style={styles.statColumn}>
                            <Text style={[styles.statValue, styles.statValueClaimed]}>
                                {claimedCount} / 30
                            </Text>
                            <Text style={styles.statLabel}>{t('hatimDetailScreen.claimedStat')}</Text>
                            <ProgressBar
                                progress={(claimedCount / 30) * 100}
                                height={6}
                                fillColor={theme.primary}
                                style={styles.miniProgressBarBackground}
                            />
                        </View>
                    </View>
                </View>

                {/* Grid */}
                <View style={[styles.gridContainer, { width: availableWidth + SPACING.md }]}>
                    <View style={styles.grid}>
                        {hatim.parts.map((part) => (
                            <TouchableOpacity
                                key={part.partNumber}
                                style={[
                                    styles.partItem,
                                    {
                                        backgroundColor: part.isCompleted
                                            ? '#2E7D32'
                                            : part.claimedById
                                                ? (part.claimedById === user?.uid ? '#1976D2' : '#78909C')
                                                : theme.cardBackground,
                                        width: partItemWidth,
                                    }
                                ]}
                                onPress={() => handlePartPress(part)}
                                disabled={actionLoading === part.partNumber}
                            >
                                {actionLoading === part.partNumber ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={[styles.partNumber, { color: part.claimedById ? '#fff' : theme.text, fontSize: numberFontSize }]}>
                                            {part.partNumber}
                                        </Text>
                                        <Text style={[styles.partClaimant, { color: part.claimedById ? 'rgba(255,255,255,0.8)' : theme.textSecondary, fontSize: claimantFontSize }]} numberOfLines={1}>
                                            {part.claimedById === user?.uid ? (user?.displayName || t('hatimDetailScreen.me')) : (part.claimedByName || t('hatimDetailScreen.available'))}
                                        </Text>
                                        {part.claimedById && !part.isCompleted && (
                                            <ProgressBar
                                                progress={((part.pagesRead || 0) / (part.totalPages || 20)) * 100}
                                                height={4}
                                                trackColor="rgba(255,255,255,0.2)"
                                                fillColor="#4CAF50"
                                                style={styles.progressBarBackground}
                                            />
                                        )}
                                    </>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Part Interaction Modal - kept same */}
            <Modal
                transparent
                visible={partModalVisible}
                animationType="fade"
                onRequestClose={() => setPartModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedPart && (
                            <>
                                <Text style={styles.modalTitle}>
                                    {t('hatimDetailScreen.partActions', { number: selectedPart.partNumber })}
                                </Text>

                                {selectedPart.claimedById ? (
                                    <View style={styles.claimInfo}>
                                        <Text style={styles.claimText}>
                                            {t('hatimDetailScreen.claimedBy')}<Text style={styles.claimedByName}>{selectedPart.claimedById === user?.uid ? (user?.displayName || t('hatimDetailScreen.me')) : selectedPart.claimedByName}</Text>
                                        </Text>
                                        <Text style={[styles.claimStatus, selectedPart.isCompleted ? styles.claimStatusCompleted : styles.claimStatusReading]}>
                                            {t('hatimDetailScreen.status', { status: selectedPart.isCompleted ? t('hatimDetailScreen.statusCompleted') : t('hatimDetailScreen.statusReading') })}
                                        </Text>

                                        {/* Page Progress Control */}
                                        {(selectedPart.claimedById === user?.uid || hatim.creatorId === user?.uid) && (
                                            <View style={styles.progressContainer}>
                                                <Text style={styles.progressLabel}>
                                                    {t('hatimDetailScreen.pagesRead', { read: localPages, total: selectedPart.totalPages || 20 })}
                                                </Text>
                                                <View style={styles.progressRow}>
                                                    <AppButton
                                                        title="-"
                                                        onPress={() => handleUpdatePages(localPages - 1)}
                                                        variant="secondary"
                                                        shape="circle"
                                                        size="small"
                                                        style={{ backgroundColor: theme.border }}
                                                        textStyle={{ color: theme.text }}
                                                    />

                                                    <TextInput
                                                        style={styles.progressInput}
                                                        value={String(localPages)}
                                                        keyboardType="number-pad"
                                                        onChangeText={(val) => {
                                                            const n = parseInt(val);
                                                            if (!isNaN(n)) handleUpdatePages(n);
                                                            else if (val === '') setLocalPages(0);
                                                        }}
                                                    />

                                                    <AppButton
                                                        title="+"
                                                        onPress={() => handleUpdatePages(localPages + 1)}
                                                        variant="secondary"
                                                        shape="circle"
                                                        size="small"
                                                        style={{ backgroundColor: theme.border }}
                                                        textStyle={{ color: theme.text }}
                                                    />
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={styles.modalDescription}>
                                        {t('hatimDetailScreen.notClaimedYet')}
                                    </Text>
                                )}

                                <View style={styles.modalButtonsColumn}>
                                    {selectedPart && (selectedPart.claimedById === user?.uid || (hatim && hatim.creatorId === user?.uid && selectedPart.claimedById)) ? (
                                        <>
                                            <AppButton
                                                title={selectedPart.isCompleted ? t('hatimDetailScreen.markIncomplete') : t('hatimDetailScreen.markComplete')}
                                                onPress={handleToggleCompletion}
                                                variant={selectedPart.isCompleted ? 'secondary' : 'primary'}
                                                style={[{ width: '100%' }, selectedPart.isCompleted ? { backgroundColor: theme.accent } : undefined]}
                                                loading={actionLoading === selectedPart.partNumber}
                                                disabled={actionLoading !== null}
                                            />

                                            <AppButton
                                                title={selectedPart.claimedById === user?.uid ? t('hatimDetailScreen.releasePart') : t('hatimDetailScreen.unclaimPart')}
                                                onPress={handleUnclaim}
                                                variant="danger"
                                                style={{ width: '100%', marginTop: SPACING.md }}
                                                disabled={actionLoading !== null}
                                            />
                                        </>
                                    ) : selectedPart && !selectedPart.claimedById ? (
                                        <AppButton
                                            title={t('hatimDetailScreen.claimPart')}
                                            onPress={handleClaim}
                                            variant="primary"
                                            style={{ width: '100%' }}
                                            loading={actionLoading === selectedPart.partNumber}
                                            disabled={actionLoading !== null}
                                        />
                                    ) : null}

                                    <AppButton
                                        title={t('hatimDetailScreen.close')}
                                        onPress={() => setPartModalVisible(false)}
                                        variant="outline"
                                        style={{ width: '100%', marginTop: SPACING.md }}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Hatim Edit Modal */}
            <Modal
                transparent
                visible={editModalVisible}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('hatimDetailScreen.editTitle')}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder={t('hatimDetailScreen.titlePlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={editTitle}
                            onChangeText={setEditTitle}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('hatimDetailScreen.descriptionPlaceholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={editDesc}
                            onChangeText={setEditDesc}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, styles.inputLabelNoMarginTop]}>{t('hatimDetailScreen.setDeadline')}</Text>
                            <Switch
                                value={hasDeadline}
                                onValueChange={setHasDeadline}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={hasDeadline ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, styles.inputLabelNoMarginTop]}>{t('hatimDetailScreen.privateHatim')}</Text>
                            <Switch
                                value={editIsPrivate}
                                onValueChange={setEditIsPrivate}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={editIsPrivate ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, styles.inputLabelNoMarginTop]}>{t('hatimDetailScreen.lockHatim')}</Text>
                            <Switch
                                value={editIsLocked}
                                onValueChange={setEditIsLocked}
                                trackColor={{ false: theme.border, true: '#607D8B' }}
                                thumbColor={editIsLocked ? '#455A64' : '#f4f3f4'}
                            />
                        </View>

                        {hasDeadline && (
                            <>
                                <Text style={styles.inputLabel}>{t('hatimDetailScreen.deadlineLabel')}</Text>

                                {Platform.OS === 'web' ? (
                                    <View style={styles.dateTimeWebContainer}>
                                        <input
                                            type="date"
                                            style={{
                                                width: '100%',
                                                padding: 12,
                                                borderRadius: 12,
                                                border: `1px solid ${theme.border}`,
                                                backgroundColor: 'transparent',
                                                color: theme.text,
                                                marginBottom: 8,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: '16px'
                                            }}
                                            onChange={(e: any) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                const [y, m, d] = val.split('-').map(Number);
                                                const current = editDeadline || new Date();
                                                current.setFullYear(y);
                                                current.setMonth(m - 1);
                                                current.setDate(d);
                                                setEditDeadline(new Date(current));
                                            }}
                                            value={editDeadline ? editDeadline.toISOString().split('T')[0] : ''}
                                        />
                                        <View style={styles.timeSelectorsRow}>
                                            <select
                                                style={{
                                                    flex: 1,
                                                    padding: 12,
                                                    borderRadius: 12,
                                                    border: `1px solid ${theme.border}`,
                                                    backgroundColor: 'transparent',
                                                    color: theme.text,
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    fontSize: '16px',
                                                    appearance: 'auto'
                                                }}
                                                onChange={(e: any) => {
                                                    const h = parseInt(e.target.value);
                                                    const current = editDeadline || new Date();
                                                    current.setHours(h);
                                                    setEditDeadline(new Date(current));
                                                }}
                                                value={editDeadline ? editDeadline.getHours() : 0}
                                            >
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <Text style={styles.timeSeparator}>:</Text>
                                            <select
                                                style={{
                                                    flex: 1,
                                                    padding: 12,
                                                    borderRadius: 12,
                                                    border: `1px solid ${theme.border}`,
                                                    backgroundColor: 'transparent',
                                                    color: theme.text,
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    fontSize: '16px',
                                                    appearance: 'auto'
                                                }}
                                                onChange={(e: any) => {
                                                    const m = parseInt(e.target.value);
                                                    const current = editDeadline || new Date();
                                                    current.setMinutes(m);
                                                    setEditDeadline(new Date(current));
                                                }}
                                                value={editDeadline ? editDeadline.getMinutes() : 0}
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
                                            style={styles.editInputStyle}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Text style={editDeadline ? styles.dateTimeTextFilled : styles.dateTimeTextEmpty}>
                                                {editDeadline
                                                    ? editDeadline.toLocaleString(i18n.language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                    : t('hatimDetailScreen.selectDateTime')}
                                            </Text>
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={editDeadline || new Date()}
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
                                                value={editDeadline || new Date()}
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
                            <AppButton
                                title={t('hatimDetailScreen.delete')}
                                onPress={handleDeleteHatim}
                                disabled={isUpdating}
                                variant="outline"
                                style={[styles.modalButton, { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE' }]}
                                textStyle={{ color: '#D32F2F' }}
                            />

                            <View style={styles.modalButtonsRight}>
                                <AppButton
                                    title={t('hatimDetailScreen.cancel')}
                                    onPress={() => setEditModalVisible(false)}
                                    variant="secondary"
                                    style={[styles.modalButton, { marginRight: SPACING.sm, backgroundColor: theme.border }]}
                                    textStyle={{ color: theme.text }}
                                />
                                <AppButton
                                    title={t('hatimDetailScreen.update')}
                                    onPress={handleUpdateHatim}
                                    loading={isUpdating}
                                    disabled={isUpdating}
                                    variant="primary"
                                    style={styles.modalButton}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
