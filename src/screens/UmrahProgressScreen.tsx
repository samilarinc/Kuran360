import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './UmrahProgressScreen.styles';

interface UmrahProgressScreenProps {
    onNavigate: () => void;
    navigation?: any; // Optional for navigation to duas screen
}

interface UmrahState {
    tawafCount: number;
    sayCount: number;
    sayDirection: 'Safa' | 'Merve';
    isIhram: boolean;
}

const STORAGE_KEY = '@umrah_progress';

export const UmrahProgressScreen: React.FC<UmrahProgressScreenProps> = ({ onNavigate, navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [progress, setProgress] = useState<UmrahState>({
        tawafCount: 0,
        sayCount: 0,
        sayDirection: 'Safa',
        isIhram: false,
    });

    // Load progress from storage
    React.useEffect(() => {
        const loadProgress = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setProgress(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Error loading umrah progress:', error);
            }
        };
        loadProgress();
    }, []);

    // Save progress to storage
    const saveProgress = async (newProgress: UmrahState) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
            setProgress(newProgress);
        } catch (error) {
            console.error('Error saving umrah progress:', error);
        }
    };

    const incrementTawaf = () => {
        if (progress.tawafCount < 7) {
            saveProgress({ ...progress, tawafCount: progress.tawafCount + 1 });
        }
    };

    const decrementTawaf = () => {
        if (progress.tawafCount > 0) {
            saveProgress({ ...progress, tawafCount: progress.tawafCount - 1 });
        }
    };

    const incrementSay = () => {
        if (progress.sayCount < 7) {
            const newCount = progress.sayCount + 1;
            const newDirection = progress.sayDirection === 'Safa' ? 'Merve' : 'Safa';
            saveProgress({ ...progress, sayCount: newCount, sayDirection: newDirection });
        }
    };

    const decrementSay = () => {
        if (progress.sayCount > 0) {
            const newCount = progress.sayCount - 1;
            const newDirection = progress.sayDirection === 'Safa' ? 'Merve' : 'Safa';
            saveProgress({ ...progress, sayCount: newCount, sayDirection: newDirection });
        }
    };

    const toggleIhram = () => {
        saveProgress({ ...progress, isIhram: !progress.isIhram });
    };

    const resetProgress = () => {
        saveProgress({
            tawafCount: 0,
            sayCount: 0,
            sayDirection: 'Safa',
            isIhram: false,
        });
    };

    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.umrahProgress')}
                showBackButton={true}
                onBackPress={onNavigate}
                showHomeButton={true}
                onHomePress={onNavigate}
            />
            <ScrollView style={styles.content}>
                {/* Tawaf Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.icon, styles.largeIcon]}>🕋</Text>
                        <Text style={styles.progressTitle}>{t('umrahProgressScreen.tawaf')}</Text>
                    </View>
                    <Text style={styles.progressCount}>
                        {progress.tawafCount} / 7
                    </Text>
                    <View style={styles.buttonRow}>
                        <AppButton
                            title="−"
                            onPress={decrementTawaf}
                            variant="outline"
                            shape="circle"
                            size="large"
                            style={styles.adjustButton}
                            textStyle={styles.adjustButtonText}
                        />
                        <AppButton
                            title="+"
                            onPress={incrementTawaf}
                            variant="outline"
                            shape="circle"
                            size="large"
                            style={styles.adjustButton}
                            textStyle={styles.adjustButtonText}
                        />
                    </View>
                    {navigation && (
                        <AppButton
                            title={t('umrahProgressScreen.tawafDuas')}
                            onPress={() => navigation.navigate('UmrahDuas')}
                            variant="ghost"
                            style={styles.duaLink}
                            textStyle={styles.duaLinkText}
                        />
                    )}
                </View>

                {/* Sa'y Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.icon, styles.largeIcon]}>🏃‍♂️</Text>
                        <Text style={styles.progressTitle}>{t('umrahProgressScreen.say')}</Text>
                    </View>
                    <Text style={styles.directionText}>
                        {progress.sayDirection === 'Safa' ? t('umrahProgressScreen.safaToMerve') : t('umrahProgressScreen.merveToSafa')}
                    </Text>
                    <Text style={styles.progressCount}>
                        {progress.sayCount} / 7
                    </Text>
                    <View style={styles.buttonRow}>
                        <AppButton
                            title="−"
                            onPress={decrementSay}
                            variant="outline"
                            shape="circle"
                            size="large"
                            style={styles.adjustButton}
                            textStyle={styles.adjustButtonText}
                        />
                        <AppButton
                            title="+"
                            onPress={incrementSay}
                            variant="outline"
                            shape="circle"
                            size="large"
                            style={styles.adjustButton}
                            textStyle={styles.adjustButtonText}
                        />
                    </View>
                    {navigation && (
                        <AppButton
                            title={t('umrahProgressScreen.sayDuas')}
                            onPress={() => navigation.navigate('UmrahDuas')}
                            variant="ghost"
                            style={styles.duaLink}
                            textStyle={styles.duaLinkText}
                        />
                    )}
                </View>

                {/* Ihram Status */}
                <TouchableOpacity
                    style={[
                        styles.ihramCard,
                        progress.isIhram ? styles.ihramCardActive : styles.ihramCardInactive,
                    ]}
                    onPress={toggleIhram}
                >
                    <Text style={[styles.icon, styles.largeIcon]}>🌙</Text>
                    <Text style={[
                        styles.ihramText,
                        progress.isIhram ? styles.ihramTextActive : styles.ihramTextInactive,
                    ]}>
                        {progress.isIhram ? t('umrahProgressScreen.inIhram') : t('umrahProgressScreen.notInIhram')}
                    </Text>
                </TouchableOpacity>
                {navigation && (
                    <AppButton
                        title={t('umrahProgressScreen.ihramDuas')}
                        onPress={() => navigation.navigate('UmrahDuas')}
                        variant="ghost"
                        style={styles.duaLinkCenter}
                        textStyle={styles.duaLinkText}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};
