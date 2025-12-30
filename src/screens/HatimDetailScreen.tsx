import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { HatimService } from '../services/HatimService';
import { Hatim, HatimPart } from '../types';
import { SPACING, FONT_SIZES } from '../constants';
import { AppHeader } from '../components/AppHeader';

interface HatimDetailScreenProps {
    navigation: any;
    route: { params: { hatimId: string } };
}

export const HatimDetailScreen: React.FC<HatimDetailScreenProps> = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { hatimId } = route.params;
    const { theme } = useTheme();
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
            Alert.alert('Hata', 'Hatim detayları yüklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    }, [hatimId]);

    useEffect(() => {
        fetchHatim().then(() => {
            if (user && hatimId) {
                HatimService.syncUserName(hatimId, user.uid, user.displayName || 'İsimsiz');
            }
        });
    }, [fetchHatim, user?.uid, user?.displayName]);

    const calculateTimeLeft = useCallback(() => {
        if (!hatim?.deadline) return;
        const now = Date.now();
        const difference = hatim.deadline - now;

        if (difference <= 0) {
            setTimeLeft('Süre doldu');
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);

        let res = '';
        if (days > 0) res += `${days} gün `;
        if (hours > 0) res += `${hours} saat `;
        res += `${minutes} dk`;
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
                // @ts-ignore
                window.alert('Bu hatim kilitlenmiştir, işlem yapılamaz.');
            } else {
                Alert.alert('Kilitli', 'Bu hatim kilitlenmiştir, işlem yapılamaz.');
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
            await HatimService.claimPart(hatimId, selectedPart.partNumber, user.uid, user.displayName || 'İsimsiz');
            setPartModalVisible(false);
            await fetchHatim(); // Wait for fetch
        } catch (error: any) {
            Alert.alert('Hata', error.message);
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
            Alert.alert('Hata', error.message);
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
            Alert.alert('Hata', error.message);
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
            Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
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
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!hatim) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: theme.text }}>Hatim bulunamadı.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: SPACING.sm }}>
                        <Text style={{ color: theme.primary }}>Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const completedCount = hatim.parts.filter(p => p.isCompleted).length;
    const claimedCount = hatim.parts.filter(p => p.claimedById).length;

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('tr-TR', {
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
            // @ts-ignore
            if (window.confirm('Bu hatimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                try {
                    setIsUpdating(true);
                    await HatimService.deleteHatim(hatimId);
                    setEditModalVisible(false);
                    navigation.goBack();
                } catch (error) {
                    console.log(error);
                    window.alert('Silme işlemi sırasında bir sorun oluştu.');
                    setIsUpdating(false);
                }
            }
            return;
        }

        Alert.alert(
            'Hatimi Sil',
            'Bu hatimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsUpdating(true);
                            await HatimService.deleteHatim(hatimId);
                            setEditModalVisible(false);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Hata', 'Silme işlemi sırasında bir sorun oluştu.');
                            setIsUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title={hatim.title}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            >
                {hatim.creatorId === user?.uid && (
                    <TouchableOpacity onPress={openEditModal} style={styles.editButton}>
                        <Text style={[styles.editButtonText, { color: theme.headerText }]}>Düzenle</Text>
                    </TouchableOpacity>
                )}
            </AppHeader>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ... existing stats ... */}
                <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.description, { color: theme.textSecondary }]}>
                        {hatim.description || 'Açıklama belirtilmemiş.'}
                    </Text>
                    {hatim.deadline && (
                        <View style={styles.deadlineInfo}>
                            <Text style={[styles.deadlineText, { color: theme.primary }]}>
                                Son Katılım: {formatDate(hatim.deadline)}
                            </Text>
                            <View style={[styles.countdownBadge, { backgroundColor: theme.primary + '15' }]}>
                                <Text style={[styles.countdownText, { color: theme.primary }]}>
                                    Kalan Süre: {timeLeft}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statColumn}>
                            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{completedCount} / 30</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tamamlanan</Text>
                            <View style={[styles.miniProgressBarBackground, { backgroundColor: theme.border }]}>
                                <View
                                    style={[
                                        styles.miniProgressBarFill,
                                        {
                                            width: `${(completedCount / 30) * 100}%`,
                                            backgroundColor: '#4CAF50'
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                        <View style={styles.statColumn}>
                            <Text style={[styles.statValue, { color: theme.primary }]}>
                                {claimedCount} / 30
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Alınan Cüz</Text>
                            <View style={[styles.miniProgressBarBackground, { backgroundColor: theme.border }]}>
                                <View
                                    style={[
                                        styles.miniProgressBarFill,
                                        {
                                            width: `${(claimedCount / 30) * 100}%`,
                                            backgroundColor: theme.primary
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Grid */}
                <View style={[styles.gridContainer, { width: availableWidth + SPACING.md, alignSelf: 'center' }]}>
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
                                        borderColor: theme.border,
                                        width: partItemWidth,
                                        marginRight: SPACING.md / 2,
                                        marginLeft: SPACING.md / 2,
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
                                            {part.claimedById === user?.uid ? (user?.displayName || 'Ben') : (part.claimedByName || 'Müsait')}
                                        </Text>
                                        {part.claimedById && !part.isCompleted && (
                                            <View style={styles.progressBarBackground}>
                                                <View style={[
                                                    styles.progressBarFill,
                                                    { width: `${((part.pagesRead || 0) / (part.totalPages || 20)) * 100}%` }
                                                ]} />
                                            </View>
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
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        {selectedPart && (
                            <>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>
                                    {selectedPart.partNumber}. Cüz İşlemleri
                                </Text>

                                {selectedPart.claimedById ? (
                                    <View style={styles.claimInfo}>
                                        <Text style={[styles.claimText, { color: theme.textSecondary }]}>
                                            Bu cüzü alan: <Text style={{ color: theme.text, fontWeight: '700' }}>{selectedPart.claimedById === user?.uid ? (user?.displayName || 'Ben') : selectedPart.claimedByName}</Text>
                                        </Text>
                                        <Text style={[styles.claimStatus, { color: selectedPart.isCompleted ? '#4CAF50' : '#FF9800' }]}>
                                            Durum: {selectedPart.isCompleted ? 'Tamamlandı' : 'Okunuyor'}
                                        </Text>

                                        {/* Page Progress Control */}
                                        {(selectedPart.claimedById === user?.uid || hatim.creatorId === user?.uid) && (
                                            <View style={styles.progressContainer}>
                                                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                                                    Okunan Sayfa: {localPages} / {selectedPart.totalPages || 20}
                                                </Text>
                                                <View style={styles.progressRow}>
                                                    <TouchableOpacity
                                                        style={[styles.progressBtn, { backgroundColor: theme.border }]}
                                                        onPress={() => handleUpdatePages(localPages - 1)}
                                                    >
                                                        <Text style={{ color: theme.text, fontSize: 20 }}>-</Text>
                                                    </TouchableOpacity>

                                                    <TextInput
                                                        style={[styles.progressInput, { color: theme.text, borderColor: theme.border }]}
                                                        value={String(localPages)}
                                                        keyboardType="number-pad"
                                                        onChangeText={(val) => {
                                                            const n = parseInt(val);
                                                            if (!isNaN(n)) handleUpdatePages(n);
                                                            else if (val === '') setLocalPages(0);
                                                        }}
                                                    />

                                                    <TouchableOpacity
                                                        style={[styles.progressBtn, { backgroundColor: theme.border }]}
                                                        onPress={() => handleUpdatePages(localPages + 1)}
                                                    >
                                                        <Text style={{ color: theme.text, fontSize: 20 }}>+</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                                        Bu cüz henüz alınmamış. Almak istiyor musunuz?
                                    </Text>
                                )}

                                <View style={styles.modalButtonsColumn}>
                                    {selectedPart && (selectedPart.claimedById === user?.uid || (hatim && hatim.creatorId === user?.uid && selectedPart.claimedById)) ? (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: selectedPart.isCompleted ? theme.accent : theme.primary }]}
                                                onPress={handleToggleCompletion}
                                                disabled={actionLoading !== null}
                                            >
                                                {actionLoading === selectedPart.partNumber ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text style={styles.actionButtonText}>
                                                        {selectedPart.isCompleted ? 'Tamamlanmadı İşaretle' : 'Tamamlandı İşaretle'}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: '#d32f2f', marginTop: SPACING.md }]}
                                                onPress={handleUnclaim}
                                                disabled={actionLoading !== null}
                                            >
                                                <Text style={styles.actionButtonText}>
                                                    {selectedPart.claimedById === user?.uid ? 'Cüzü Bırak' : 'Cüzü İptal Et (Yönetici)'}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : selectedPart && !selectedPart.claimedById ? (
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                            onPress={handleClaim}
                                            disabled={actionLoading !== null}
                                        >
                                            {actionLoading === selectedPart.partNumber ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.actionButtonText}>Cüzü Üzerine Al</Text>
                                            )}
                                        </TouchableOpacity>
                                    ) : null}

                                    <TouchableOpacity
                                        style={[styles.closeButton, { borderColor: theme.border }]}
                                        onPress={() => setPartModalVisible(false)}
                                    >
                                        <Text style={{ color: theme.text }}>Kapat</Text>
                                    </TouchableOpacity>
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
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Hatimi Düzenle</Text>

                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Hatim Başlığı"
                            placeholderTextColor={theme.textSecondary}
                            value={editTitle}
                            onChangeText={setEditTitle}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Açıklama"
                            placeholderTextColor={theme.textSecondary}
                            value={editDesc}
                            onChangeText={setEditDesc}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 0 }]}>Bitiş Tarihi Belirle</Text>
                            <Switch
                                value={hasDeadline}
                                onValueChange={setHasDeadline}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={hasDeadline ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 0 }]}>Gizli Hatim</Text>
                            <Switch
                                value={editIsPrivate}
                                onValueChange={setEditIsPrivate}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={editIsPrivate ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 0 }]}>Hatimi Kilitle (Salt Okunur)</Text>
                            <Switch
                                value={editIsLocked}
                                onValueChange={setEditIsLocked}
                                trackColor={{ false: theme.border, true: '#607D8B' }}
                                thumbColor={editIsLocked ? '#455A64' : '#f4f3f4'}
                            />
                        </View>

                        {hasDeadline && (
                            <>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Son Katılım Tarihi</Text>

                                {Platform.OS === 'web' ? (
                                    <View style={{ marginBottom: 16 }}>
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
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                                            <Text style={{ marginHorizontal: 8, color: theme.text, fontSize: 18, fontWeight: '700' }}>:</Text>
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
                                            style={[styles.editInputStyle, { borderColor: theme.border, justifyContent: 'center' }]}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Text style={{ color: editDeadline ? theme.text : theme.textSecondary }}>
                                                {editDeadline
                                                    ? editDeadline.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                    : 'Tarih ve Saat Seçin'}
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
                                                locale="tr-TR"
                                            />
                                        )}

                                        {showTimePicker && (
                                            <DateTimePicker
                                                value={editDeadline || new Date()}
                                                mode="time"
                                                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                                onChange={onTimeChange}
                                                is24Hour={true}
                                                locale="tr-TR"
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        <View style={[styles.modalButtons, { justifyContent: 'space-between', marginTop: SPACING.lg }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' }]}
                                onPress={handleDeleteHatim}
                                disabled={isUpdating}
                            >
                                <Text style={{ color: '#D32F2F', fontWeight: '600' }}>Sil</Text>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: theme.border, marginRight: SPACING.sm }]}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <Text style={{ color: theme.text }}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                    onPress={handleUpdateHatim}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ color: '#fff' }}>Güncelle</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    editButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: SPACING.xs,
    },
    editButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    infoCard: {
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SPACING.xl,
    },
    description: {
        fontSize: FONT_SIZES.medium,
        lineHeight: 22,
        marginBottom: SPACING.lg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: SPACING.lg,
    },
    statColumn: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
    },
    miniProgressBarBackground: {
        height: 6,
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: SPACING.sm,
    },
    miniProgressBarFill: {
        height: '100%',
    },
    gridContainer: {
        width: '100%',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    partItem: {
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        padding: SPACING.xs,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    partNumber: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
    },
    partClaimant: {
        fontSize: 10,
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: SPACING.xl,
        borderRadius: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    modalDescription: {
        textAlign: 'center',
        marginBottom: SPACING.xl,
        fontSize: FONT_SIZES.medium,
    },
    claimInfo: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    claimText: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.xs,
    },
    claimStatus: {
        fontSize: FONT_SIZES.small,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    modalButtonsColumn: {
        width: '100%',
    },
    actionButton: {
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: FONT_SIZES.medium,
    },
    closeButton: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    progressContainer: {
        marginTop: SPACING.lg,
        alignItems: 'center',
        width: '100%',
    },
    progressLabel: {
        fontSize: 12,
        marginBottom: SPACING.sm,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressInput: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: SPACING.md,
        textAlign: 'center',
        fontSize: FONT_SIZES.medium,
        fontWeight: '700',
    },
    statValue: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
    },
    deadlineText: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: SPACING.xs,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: SPACING.sm,
    },
    modalButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        marginLeft: SPACING.md,
        minWidth: 80,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    editInputStyle: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        minHeight: 50,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    deadlineInfo: {
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    countdownBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 4,
    },
    countdownText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
