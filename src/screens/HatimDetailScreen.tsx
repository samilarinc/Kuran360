import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, useWindowDimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { HatimService } from '@/services/HatimService';
import { Hatim, HatimPart } from '@/types';
import { SPACING } from '@/theme';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { HatimStatsCard } from '@/components/HatimStatsCard';
import { HatimPartsGrid } from '@/components/HatimPartsGrid';
import { PartActionModal } from '@/components/PartActionModal';
import { HatimEditModal } from '@/components/HatimEditModal';
import { createCommonStyles } from '@/theme/common.styles';

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
    const [editIsPrivate, setEditIsPrivate] = useState(false);
    const [editIsLocked, setEditIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const styles = useMemo(() => createCommonStyles(theme), [theme]);

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
    }, [hatimId, t]);

    useEffect(() => {
        fetchHatim().then(() => {
            if (user && hatimId) {
                HatimService.syncUserName(hatimId, user.uid, user.displayName || t('profileScreen.defaultUserName'));
            }
        });
    }, [fetchHatim, hatimId, user, t]);

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
    }, [hatim?.deadline, t]);

    useEffect(() => {
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

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

    const handleClaim = async () => {
        if (!user || !hatim || !selectedPart) return;
        try {
            setActionLoading(selectedPart.partNumber);
            await HatimService.claimPart(hatimId, selectedPart.partNumber, user.uid, user.displayName || t('profileScreen.defaultUserName'));
            setPartModalVisible(false);
            await fetchHatim();
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
            await fetchHatim();
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

        setLocalPages(validatedPages);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await HatimService.updatePartProgress(hatimId, selectedPart.partNumber, user.uid, validatedPages);

                const updatedHatim = await HatimService.getHatimById(hatimId);
                if (updatedHatim) {
                    setHatim(updatedHatim);
                }
            } catch (error: any) {
                console.error('Error saving progress:', error);
            }
        }, 2000);
    };

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingView />
            </SafeAreaView>
        );
    }

    if (!hatim) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerFill}>
                    <Text style={{ color: theme.text }}>{t('hatimDetailScreen.notFound')}</Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={hatim.title}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
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

            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
                <HatimStatsCard
                    hatim={hatim}
                    completedCount={completedCount}
                    claimedCount={claimedCount}
                    timeLeft={timeLeft}
                    formattedDeadline={hatim.deadline ? formatDate(hatim.deadline) : null}
                />

                <HatimPartsGrid
                    parts={hatim.parts}
                    availableWidth={availableWidth}
                    numColumns={numColumns}
                    partItemWidth={partItemWidth}
                    numberFontSize={numberFontSize}
                    claimantFontSize={claimantFontSize}
                    currentUserId={user?.uid}
                    currentUserDisplayName={user?.displayName}
                    actionLoading={actionLoading}
                    onPartPress={handlePartPress}
                />
            </ScrollView>

            <PartActionModal
                visible={partModalVisible}
                hatim={hatim}
                part={selectedPart}
                currentUserId={user?.uid}
                currentUserDisplayName={user?.displayName}
                actionLoading={actionLoading}
                localPages={localPages}
                onClose={() => setPartModalVisible(false)}
                onUpdatePages={handleUpdatePages}
                onToggleCompletion={handleToggleCompletion}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
            />

            <HatimEditModal
                visible={editModalVisible}
                title={editTitle}
                description={editDesc}
                hasDeadline={hasDeadline}
                deadline={editDeadline}
                isPrivate={editIsPrivate}
                isLocked={editIsLocked}
                isUpdating={isUpdating}
                showDatePicker={showDatePicker}
                showTimePicker={showTimePicker}
                onChangeTitle={setEditTitle}
                onChangeDescription={setEditDesc}
                onToggleHasDeadline={setHasDeadline}
                onChangeDeadline={setEditDeadline}
                onTogglePrivate={setEditIsPrivate}
                onToggleLocked={setEditIsLocked}
                onRequestDatePicker={() => setShowDatePicker(true)}
                onDateChange={onDateChange}
                onTimeChange={onTimeChange}
                onClose={() => setEditModalVisible(false)}
                onUpdate={handleUpdateHatim}
                onDelete={handleDeleteHatim}
            />
        </SafeAreaView>
    );
};
