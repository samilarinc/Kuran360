import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Animated,
    PanResponder,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookOpen, MapPin, ListOrdered, Sparkles } from 'lucide-react-native';
import { Verse } from '@/components/Verse';
import { AppHeader } from '@/components/AppHeader';
import { DownloadRequired } from '@/components/DownloadRequired';
import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { LoadingView } from '@/components/LoadingView';
import { ErrorView } from '@/components/ErrorView';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { getSurahName } from '@/utils/surahName';
import { useDebouncedSettings } from '@/hooks/useDebouncedSettings';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDownloadData } from '@/hooks/useDownloadData';
import { getRandomVerse } from '@/data/quranData';
import { Surah, Verse as VerseType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStyles } from './RandomVerseScreen.styles';

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
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    useDebouncedSettings(200);
    const { audioState, toggleVerse } = useGlobalAudio();
    useAuth();

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
            toggleVerse(currentVerse.verse);
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
            <SafeAreaView style={common.container}>
                <AppHeader
                    title={t('screenTitles.randomVerse')}
                    showBackButton={true}
                    onBackPress={navigation.goBack}
                    showHomeButton={true}
                    onHomePress={() => navigation.navigate('Main')}
                />
                <DownloadRequired
                    title={t('homeScreen.downloadTitle')}
                    description={t('homeScreen.downloadDescription')}
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
            <SafeAreaView style={common.container}>
                <LoadingView text={t('randomVerseScreen.loading')} />
            </SafeAreaView>
        );
    }

    if (!currentVerse) {
        return (
            <SafeAreaView style={common.container}>
                <ErrorView
                    text={t('randomVerseScreen.loadError')}
                    retryText={t('randomVerseScreen.retry')}
                    onRetry={() => loadRandomVerse(true)}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={common.container}>
            {/* Header */}
            <AppHeader
                title={t('screenTitles.randomVerse')}
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
                        style={common.flex1}
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
                style={styles.surahInfoContainer}
                onPress={handleGoToSurah}
                activeOpacity={0.7}
            >
                <View style={[common.rowBetween, common.mbXs]}>
                    <View style={common.center}>
                        <Text style={styles.surahName}>
                            {getSurahName(t, currentVerse.surah)}
                        </Text>
                        <Text style={styles.surahArabicName}>
                            {currentVerse.surah.arabicName}
                        </Text>
                    </View>
                    <View style={styles.verseNumberBadge}>
                        <Text style={styles.verseNumberLabel}>
                            {t('randomVerseScreen.verseBadge')}
                        </Text>
                        <Text style={styles.verseNumberText}>
                            {currentVerse.verseIndex + 1}
                        </Text>
                    </View>
                </View>
                <View style={[common.rowGap, common.mtSm]}>
                    <Badge variant="tint" icon={<BookOpen size={12} color={theme.primary} />} label={t('randomVerseScreen.surahLabel', { number: currentVerse.surah.number })} />
                    <Badge variant="tint" icon={<MapPin size={12} color={theme.primary} />} label={t('randomVerseScreen.placeLabel', { place: currentVerse.surah.revelationPlace })} />
                    <Badge variant="tint" icon={<ListOrdered size={12} color={theme.primary} />} label={t('randomVerseScreen.verseCountLabel', { count: currentVerse.surah.verseCount })} />
                </View>
            </TouchableOpacity>

            {/* Bottom actions */}
            <View style={styles.bottomActions}>
                <AppButton
                    title={t('randomVerseScreen.newVerseButton')}
                    icon={<Sparkles size={16} color="#fff" />}
                    onPress={handleNewRandomVerse}
                    variant="primary"
                    loading={isLoadingNew}
                    disabled={isAnimating}
                />
            </View>
        </SafeAreaView>
    );
};
