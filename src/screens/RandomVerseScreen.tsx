import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Animated,
    PanResponder,
    ScrollView,
} from 'react-native';
import { Verse } from '../components/Verse';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { DownloadRequired } from '../components/DownloadRequired';
import { useTheme } from '../contexts/ThemeContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { useGlobalAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import { useDownloadData } from '../hooks/useDownloadData';
import { getRandomVerse } from '../data/quranData';
import { Surah, Verse as VerseType } from '../types';
import { FONT_SIZES, SPACING } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RandomVerseScreenProps {
    navigation: {
        navigate: (screen: 'Main' | 'Home' | 'SurahDetail' | 'Settings' | 'Search' | 'About' | 'Profile' | 'Forum' | 'ForumThread' | 'RandomVerse', params?: any) => void;
        goBack: () => void;
    };
    isDataAvailable: boolean;
}

interface CachedRandomVerse {
    surah: Surah;
    verse: VerseType;
    verseIndex: number;
    timestamp: number;
}

const CACHE_KEY = 'randomVerse';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const RandomVerseScreen: React.FC<RandomVerseScreenProps> = ({ navigation, isDataAvailable }) => {
    const { theme } = useTheme();
    const { settings } = useDebouncedSettings(200);
    const { audioState, playVerse } = useGlobalAudio();
    const { user } = useAuth();

    const [currentVerse, setCurrentVerse] = useState<{
        surah: Surah;
        verse: VerseType;
        verseIndex: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingNew, setIsLoadingNew] = useState(false);
    const {
        downloading,
        downloadProgress,
        downloadStatus,
        downloadedBytes,
        totalBytes,
        handleDownloadData,
    } = useDownloadData({ isDataAvailable, navigation });

    // Animation and swipe handling
    const translateX = useRef(new Animated.Value(0)).current;
    const [isAnimating, setIsAnimating] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const swipeThreshold = screenWidth * 0.3;

    // Load cached verse or get a new one
    const loadRandomVerse = async (forceNew = false) => {
        if (forceNew) {
            setIsLoadingNew(true);
        } else {
            setIsLoading(true);
        }

        try {
            if (!forceNew) {
                // Try to load from cache first
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    const cachedVerse: CachedRandomVerse = JSON.parse(cached);
                    const now = Date.now();

                    // Check if cache is still valid (within 24 hours)
                    if (now - cachedVerse.timestamp < CACHE_DURATION) {
                        setCurrentVerse({
                            surah: cachedVerse.surah,
                            verse: cachedVerse.verse,
                            verseIndex: cachedVerse.verseIndex,
                        });
                        setIsLoading(false);
                        setIsLoadingNew(false);
                        return;
                    }
                }
            }

            // Get new random verse
            const randomVerseData = await getRandomVerse();
            if (randomVerseData) {
                setCurrentVerse(randomVerseData);

                // Cache the new verse
                const cacheData: CachedRandomVerse = {
                    ...randomVerseData,
                    timestamp: Date.now(),
                };
                await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            }
        } catch (error) {
            console.error('Error loading random verse:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingNew(false);
        }
    };

    useEffect(() => {
        if (!isDataAvailable) {
            return;
        }

        loadRandomVerse();
    }, [isDataAvailable]);

    const handleNewRandomVerse = () => {
        if (!isLoadingNew && !isAnimating) {
            // Animate out current verse, then load new one
            setIsAnimating(true);
            Animated.timing(translateX, {
                toValue: -screenWidth,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                loadRandomVerse(true).then(() => {
                    // Reset position and animate in
                    translateX.setValue(screenWidth);
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => {
                        setIsAnimating(false);
                    });
                });
            });
        }
    };

    const handleGoToSurah = () => {
        if (currentVerse) {
            navigation.navigate('SurahDetail', {
                surah: currentVerse.surah,
                verseIndex: currentVerse.verseIndex
            });
        }
    };

    const handlePlayVerse = () => {
        if (currentVerse?.verse) {
            playVerse(currentVerse.verse);
        }
    };

    // Swipe gesture handler
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 100;
        },
        onPanResponderMove: (_, gestureState) => {
            if (!isAnimating && !isLoadingNew) {
                translateX.setValue(gestureState.dx);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (!isAnimating && !isLoadingNew) {
                if (Math.abs(gestureState.dx) > swipeThreshold) {
                    // Swipe detected - get new random verse
                    handleNewRandomVerse();
                } else {
                    // Snap back to original position
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            }
        },
    });

    if (!isDataAvailable) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <HeaderWithDarkModeToggle
                    title="Rastgele Ayet"
                    showBackButton={true}
                    onBackPress={navigation.goBack}
                    showHomeButton={true}
                    onHomePress={() => navigation.navigate('Main')}
                />
                <DownloadRequired
                    title="Kur'an-ı Kerim Meali"
                    description="Ayetleri okuyabilmek için Türkçe meal verilerini indirmeniz gerekmektedir."
                    totalBytes={totalBytes}
                    downloading={downloading}
                    downloadProgress={downloadProgress}
                    downloadStatus={downloadStatus}
                    downloadedBytes={downloadedBytes}
                    onDownloadPress={handleDownloadData}
                />
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>Rastgele ayet yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentVerse) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.text }]}>Ayet yüklenemedi</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.primary }]}
                        onPress={() => loadRandomVerse(true)}
                    >
                        <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                            Tekrar Dene
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <HeaderWithDarkModeToggle
                title="Rastgele Ayet"
                showBackButton={true}
                onBackPress={navigation.goBack}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            {/* Paginated-style verse display */}
            <View style={styles.verseContainer} {...panResponder.panHandlers}>
                <Animated.View
                    style={[
                        styles.verseContent,
                        {
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!isAnimating}
                    >
                        <Verse
                            verse={currentVerse.verse}
                            isPlaying={audioState.isPlaying && audioState.currentVerse?.id === currentVerse.verse.id}
                            onPlayPress={handlePlayVerse}
                            showBookmarkButton={true}
                            showMemorization={false}
                            navigation={navigation}
                        />
                    </ScrollView>
                </Animated.View>
            </View>

            {/* Surah info moved to bottom */}
            <TouchableOpacity
                style={[styles.surahInfoContainer, { backgroundColor: theme.surface }]}
                onPress={handleGoToSurah}
                activeOpacity={0.7}
            >
                <View style={styles.surahInfoContent}>
                    <View style={styles.surahNameSection}>
                        <Text style={[styles.surahName, { color: theme.text }]}>
                            {currentVerse.surah.name}
                        </Text>
                        <Text style={[styles.surahArabicName, { color: theme.textSecondary }]}>
                            {currentVerse.surah.arabicName}
                        </Text>
                    </View>
                    <View style={[styles.verseNumberBadge, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.verseNumberLabel, { color: '#FFFFFF' }]}>
                            AYET
                        </Text>
                        <Text style={[styles.verseNumberText, { color: '#FFFFFF' }]}>
                            {currentVerse.verseIndex + 1}
                        </Text>
                    </View>
                </View>
                <View style={styles.surahMetaInfo}>
                    <View style={[styles.metaChip, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.metaText, { color: theme.primary }]}>
                            📚 {currentVerse.surah.number}. Sure
                        </Text>
                    </View>
                    <View style={[styles.metaChip, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.metaText, { color: theme.primary }]}>
                            📍 {currentVerse.surah.revelationPlace}
                        </Text>
                    </View>
                    <View style={[styles.metaChip, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.metaText, { color: theme.primary }]}>
                            📖 {currentVerse.surah.verseCount} Ayet
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Bottom actions */}
            <View style={[styles.bottomActions, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    style={[
                        styles.newVerseButton,
                        {
                            backgroundColor: theme.primary,
                            opacity: isLoadingNew ? 0.6 : 1
                        }
                    ]}
                    onPress={handleNewRandomVerse}
                    disabled={isLoadingNew || isAnimating}
                >
                    {isLoadingNew ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={[styles.newVerseButtonText, { color: '#FFFFFF' }]}>
                            ✨ Yeni Rastgele Ayet
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: FONT_SIZES.medium,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.lg,
        padding: SPACING.lg,
    },
    errorText: {
        fontSize: FONT_SIZES.large,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    verseContainer: {
        flex: 1,
        position: 'relative',
    },
    verseContent: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: SPACING.xl * 3, // Extra space for surah info and bottom actions
        paddingHorizontal: SPACING.md,
    },
    surahInfoContainer: {
        padding: SPACING.md,
        margin: SPACING.md,
        marginBottom: SPACING.xl, // Extra bottom margin for better scroll space
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    surahInfoContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    surahNameSection: {
        alignItems: 'center',
    },
    surahName: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: 2,
        textAlign: 'center',
    },
    surahArabicName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '500',
        textAlign: 'center',
    },
    verseNumberBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 16,
        minWidth: 60,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    verseNumberLabel: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    verseNumberText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
    },
    surahMetaInfo: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    metaChip: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
    },
    surahDetails: {
        fontSize: FONT_SIZES.small,
        fontStyle: 'italic',
    },
    bottomActions: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl, // Extra bottom padding for better accessibility
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    swipeHint: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        marginBottom: SPACING.md,
        fontStyle: 'italic',
    },
    newVerseButton: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    newVerseButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
});
