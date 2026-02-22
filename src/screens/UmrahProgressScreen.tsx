import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title="Şu an neredeyim?"
                showBackButton={true}
                onBackPress={onNavigate}
            />
            <ScrollView style={styles.content}>
                {/* Tawaf Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.icon, styles.largeIcon]}>🕋</Text>
                        <Text style={[styles.progressTitle, { color: theme.text }]}>Tavaf</Text>
                    </View>
                    <Text style={[styles.progressCount, { color: theme.primary }]}>
                        {progress.tawafCount} / 7
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.adjustButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={decrementTawaf}
                        >
                            <Text style={[styles.adjustButtonText, { color: theme.text }]}>−</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.adjustButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={incrementTawaf}
                        >
                            <Text style={[styles.adjustButtonText, { color: theme.text }]}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {navigation && (
                        <TouchableOpacity
                            style={styles.duaLink}
                            onPress={() => navigation.navigate('UmrahDuas')}
                        >
                            <Text style={[styles.duaLinkText, { color: theme.primary }]}>Tavaf Duaları →</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Sa'y Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.icon, styles.largeIcon]}>🏃‍♂️</Text>
                        <Text style={[styles.progressTitle, { color: theme.text }]}>Sa'y</Text>
                    </View>
                    <Text style={[styles.directionText, { color: theme.textSecondary }]}>
                        {progress.sayDirection === 'Safa' ? 'Safa → Merve' : 'Merve → Safa'}
                    </Text>
                    <Text style={[styles.progressCount, { color: theme.primary }]}>
                        {progress.sayCount} / 7
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.adjustButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={decrementSay}
                        >
                            <Text style={[styles.adjustButtonText, { color: theme.text }]}>−</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.adjustButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={incrementSay}
                        >
                            <Text style={[styles.adjustButtonText, { color: theme.text }]}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {navigation && (
                        <TouchableOpacity
                            style={styles.duaLink}
                            onPress={() => navigation.navigate('UmrahDuas')}
                        >
                            <Text style={[styles.duaLinkText, { color: theme.primary }]}>Sa'y Duaları →</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Ihram Status */}
                <TouchableOpacity
                    style={[
                        styles.ihramCard,
                        { backgroundColor: progress.isIhram ? theme.primary : theme.surface, borderColor: theme.border }
                    ]}
                    onPress={toggleIhram}
                >
                    <Text style={[styles.icon, styles.largeIcon]}>🌙</Text>
                    <Text style={[
                        styles.ihramText,
                        { color: progress.isIhram ? '#FFFFFF' : theme.text }
                    ]}>
                        {progress.isIhram ? 'İhramdayım' : 'İhramda Değilim'}
                    </Text>
                </TouchableOpacity>
                {navigation && (
                    <TouchableOpacity
                        style={styles.duaLinkCenter}
                        onPress={() => navigation.navigate('UmrahDuas')}
                    >
                        <Text style={[styles.duaLinkText, { color: theme.primary }]}>İhram Duaları →</Text>
                    </TouchableOpacity>
                )}
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
        padding: SPACING.lg,
    },
    progressCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    icon: {
        fontSize: FONT_SIZES.xlarge,
        marginRight: SPACING.sm,
    },
    largeIcon: {
        fontSize: 48,
    },
    progressTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
    },
    progressCount: {
        fontSize: 64,
        fontWeight: 'bold',
        marginVertical: SPACING.lg,
    },
    directionText: {
        fontSize: FONT_SIZES.large,
        marginBottom: SPACING.sm,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    adjustButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adjustButtonText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    ihramCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ihramText: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginLeft: SPACING.md,
    },
    resetButton: {
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    duaLink: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    duaLinkCenter: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.xs,
        alignItems: 'center',
    },
    duaLinkText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
});
