import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    PanResponder,
    Animated,
} from 'react-native';
import { Verse } from './Verse';
import { GoToVerseModal } from './GoToVerseModal';
import { Verse as VerseType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useGlobalAudio } from '../contexts/AudioContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import { FONT_SIZES, SPACING } from '../constants';

const getScreenDimensions = () => Dimensions.get('window');
const initialDimensions = getScreenDimensions();
const isSmallScreen = initialDimensions.height < 700; // Phones with height less than 700dp

interface PaginatedVerseViewProps {
    verses: VerseType[];
    initialVerseIndex?: number;
    onVerseChange?: (verseIndex: number) => void;
}

export const PaginatedVerseView: React.FC<PaginatedVerseViewProps> = React.memo(({
    verses,
    initialVerseIndex = 0,
    onVerseChange,
}) => {
    const { settings, updateSettings } = useSettings();
    const { theme } = useTheme();
    const { audioState, playVerse } = useGlobalAudio();
    const { user } = useAuth();
    const [currentVerseIndex, setCurrentVerseIndex] = useState(initialVerseIndex);
    const [isInitialized, setIsInitialized] = useState(false);
    const lastInitializedSurah = useRef<number | null>(null);
    // Lock the initially requested index; ignore later prop changes to avoid resets
    const initialIndexRef = useRef<number>(initialVerseIndex ?? 0);
    // Compute once per render for readability
    const currentSurahNumber = verses[0]?.surahNumber as number | undefined;
    const [isGoToVerseModalVisible, setIsGoToVerseModalVisible] = useState(false);
    const [isUserNavigating, setIsUserNavigating] = useState(false);

    // Dynamic screen dimensions state
    const [screenDimensions, setScreenDimensions] = useState(initialDimensions);
    const screenWidth = screenDimensions.width;
    const screenHeight = screenDimensions.height;
    const isMobileScreen = screenWidth < 768; // Mobile vs tablet threshold

    // Animation values
    const translateX = useRef(new Animated.Value(0)).current;
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Listen for dimension changes (web resize, device rotation)
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenDimensions(window);
        });

        return () => subscription?.remove();
    }, []);

    useEffect(() => {
        // Initialize once per surah; do not re-init on prop churn or re-renders
        if (!currentSurahNumber || verses.length === 0) return;

        const isNewSurah = lastInitializedSurah.current !== currentSurahNumber;
        if (isNewSurah) {
            // Honor the requested initial index for this new surah
            initialIndexRef.current = initialVerseIndex ?? 0;
            const validIndex = Math.max(0, Math.min(initialIndexRef.current, verses.length - 1));
            if (currentVerseIndex !== validIndex) {
                logger.debug('PaginatedVerseView: init for surah', currentSurahNumber, '-> verse index', validIndex, '(len:', verses.length, ')');
                setCurrentVerseIndex(validIndex);
            } else {
                logger.debug('PaginatedVerseView: init skipped; already at index', currentVerseIndex, 'for surah', currentSurahNumber);
            }
            lastInitializedSurah.current = currentSurahNumber;
            setIsInitialized(true);
        }
    }, [currentSurahNumber, verses.length, initialVerseIndex]);

    useEffect(() => {
        // Only call onVerseChange when the verse actually changes after initialization
        if (isInitialized && onVerseChange) {
            logger.debug('PaginatedVerseView: Calling onVerseChange with index', currentVerseIndex);
            onVerseChange(currentVerseIndex);
        }
    }, [currentVerseIndex]); // Only depend on currentVerseIndex

    // Auto-follow effect: Navigate to verse when audio is playing and tracking is enabled
    useEffect(() => {
        if (audioState?.currentVerse &&
            audioState.isPlaying &&
            isInitialized &&
            settings.audioTrackingEnabled &&
            !isUserNavigating) { // Don't auto-navigate if user is manually navigating

            // Only auto-navigate if we're viewing the same surah as the playing audio
            const currentSurah = verses[0]; // Get first verse to check surah number
            if (!currentSurah || currentSurah.surahNumber !== audioState.currentVerse.surahNumber) {
                return; // Don't auto-navigate if we're on a different surah
            }

            // Increased debounce to prevent excessive navigation during rapid audio changes
            const timeoutId = setTimeout(() => {
                // Find the index of the currently playing verse
                const playingVerseIndex = verses.findIndex(verse =>
                    audioState.currentVerse &&
                    verse.surahNumber === audioState.currentVerse.surahNumber &&
                    verse.number === audioState.currentVerse.number
                );

                // Only navigate if the playing verse is different from current verse
                if (playingVerseIndex !== -1 && playingVerseIndex !== currentVerseIndex) {
                    logger.debug('PaginatedVerseView: Auto-following audio from verse', currentVerseIndex, 'to', playingVerseIndex);
                    setCurrentVerseIndex(playingVerseIndex);
                }
            }, 300); // Increased to 300ms debounce for better stability

            return () => clearTimeout(timeoutId);
        }
    }, [audioState?.currentVerse, audioState?.isPlaying, verses, currentVerseIndex, isInitialized, settings.audioTrackingEnabled, isUserNavigating]);

    const goToVerse = (index: number, animated: boolean = true, isUserManual: boolean = false) => {
        if (index >= 0 && index < verses.length && !isAnimating) {
            // Mark as user navigating when manual
            if (isUserManual) {
                setIsUserNavigating(true);
                // Auto-disable audio tracking when user manually navigates
                if (settings.audioTrackingEnabled) {
                    updateSettings({ audioTrackingEnabled: false });
                }
                // Re-enable auto-navigation after a delay
                setTimeout(() => setIsUserNavigating(false), 2000);
            }

            if (animated) {
                setIsAnimating(true);
                const direction = index > currentVerseIndex ? -1 : 1;
                const distance = screenWidth * direction;

                // Animate to the target position
                Animated.timing(translateX, {
                    toValue: distance,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    // Update the verse index without animation
                    setCurrentVerseIndex(index);

                    // Reset position instantly
                    translateX.setValue(0);
                    setIsAnimating(false);
                });
            } else {
                setCurrentVerseIndex(index);
            }
        }
    };

    const goToPrevious = () => {
        if (currentVerseIndex > 0) {
            goToVerse(currentVerseIndex - 1, true, true); // Mark as user manual
        }
    };

    const goToNext = () => {
        if (currentVerseIndex < verses.length - 1) {
            goToVerse(currentVerseIndex + 1, true, true); // Mark as user manual
        }
    };

    // Enhanced pan responder for smooth swipe animations
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            // More sensitive detection for phones
            const minSwipeDistance = isMobileScreen ? 15 : 20;
            return !isAnimating && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > minSwipeDistance;
        },
        onPanResponderGrant: () => {
            // User started swiping - temporarily disable auto-tracking
            setIsUserNavigating(true);
        },
        onPanResponderMove: (evt, gestureState) => {
            if (isAnimating) return;

            const { dx } = gestureState;
            let clampedDx = dx;

            // Calculate maximum allowed swipe distance
            const maxSwipeDistance = screenWidth * 0.8; // Limit to 80% of screen width

            // Prevent swiping beyond boundaries with rubber band effect
            if (currentVerseIndex === 0 && dx > 0) {
                clampedDx = dx * 0.3; // Rubber band effect for left boundary
            } else if (currentVerseIndex === verses.length - 1 && dx < 0) {
                clampedDx = dx * 0.3; // Rubber band effect for right boundary
            } else {
                // Limit the swipe distance to prevent going beyond adjacent verses
                if (dx > maxSwipeDistance) {
                    clampedDx = maxSwipeDistance + (dx - maxSwipeDistance) * 0.2; // Diminishing returns beyond limit
                } else if (dx < -maxSwipeDistance) {
                    clampedDx = -maxSwipeDistance + (dx + maxSwipeDistance) * 0.2; // Diminishing returns beyond limit
                }
            }

            // Update translation in real-time
            translateX.setValue(clampedDx);
        },
        onPanResponderRelease: (evt, gestureState) => {
            if (isAnimating) return;

            const { dx, vx } = gestureState;

            // More phone-friendly thresholds
            let threshold;
            if (isMobileScreen) {
                threshold = Math.min(screenWidth * 0.15, 80);
                const velocityThreshold = 0.3;

                if (Math.abs(vx) > velocityThreshold) {
                    threshold = Math.min(threshold * 0.6, 50);
                }
            } else {
                threshold = screenWidth * 0.25;
            }

            setIsAnimating(true);

            if (dx > threshold && currentVerseIndex > 0) {
                // Swipe right - go to previous
                // Disable audio tracking for swipe navigation
                if (settings.audioTrackingEnabled) {
                    updateSettings({ audioTrackingEnabled: false });
                }

                Animated.timing(translateX, {
                    toValue: screenWidth,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentVerseIndex(currentVerseIndex - 1);
                    translateX.setValue(0);
                    setIsAnimating(false);
                    // Re-enable auto-navigation after a delay
                    setTimeout(() => setIsUserNavigating(false), 2000);
                });
            } else if (dx < -threshold && currentVerseIndex < verses.length - 1) {
                // Swipe left - go to next
                // Disable audio tracking for swipe navigation
                if (settings.audioTrackingEnabled) {
                    updateSettings({ audioTrackingEnabled: false });
                }

                Animated.timing(translateX, {
                    toValue: -screenWidth,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentVerseIndex(currentVerseIndex + 1);
                    translateX.setValue(0);
                    setIsAnimating(false);
                    // Re-enable auto-navigation after a delay
                    setTimeout(() => setIsUserNavigating(false), 2000);
                });
            } else {
                // Snap back to original position
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 150,
                    friction: 8,
                }).start(() => {
                    setIsAnimating(false);
                    // Re-enable auto-navigation after a short delay
                    setTimeout(() => setIsUserNavigating(false), 500);
                });
            }
        },
    });

    // Get the three verses: previous, current, next
    const getVisibleVerses = () => {
        return {
            previous: currentVerseIndex > 0 ? verses[currentVerseIndex - 1] : null,
            current: verses[currentVerseIndex],
            next: currentVerseIndex < verses.length - 1 ? verses[currentVerseIndex + 1] : null,
        };
    };

    const visibleVerses = getVisibleVerses();

    const currentVerse = verses[currentVerseIndex];

    // Create styles with current screen width
    const styles = React.useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);

    if (!currentVerse) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Ayet bulunamadı</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with verse info and navigation */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.navButton, (currentVerseIndex === 0 || isAnimating) && styles.navButtonDisabled]}
                    onPress={goToPrevious}
                    disabled={currentVerseIndex === 0 || isAnimating}
                >
                    <Text style={[styles.navButtonText, (currentVerseIndex === 0 || isAnimating) && styles.navButtonTextDisabled]}>
                        ← Önceki
                    </Text>
                </TouchableOpacity>

                <View style={styles.verseInfo}>
                    <TouchableOpacity
                        style={styles.verseNumberButton}
                        onPress={() => setIsGoToVerseModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.verseNumberButtonText}>
                            Ayet {currentVerse.number}
                            <Text style={styles.verseTotal}> / {verses.length}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.navButton, (currentVerseIndex === verses.length - 1 || isAnimating) && styles.navButtonDisabled]}
                    onPress={goToNext}
                    disabled={currentVerseIndex === verses.length - 1 || isAnimating}
                >
                    <Text style={[styles.navButtonText, (currentVerseIndex === verses.length - 1 || isAnimating) && styles.navButtonTextDisabled]}>
                        Sonraki →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Verse content with animated swipe gesture */}
            <View style={styles.contentContainer} {...panResponder.panHandlers}>
                <Animated.View
                    style={[
                        styles.animatedContainer,
                        {
                            flexDirection: 'row',
                            width: screenWidth * 3, // Width for 3 verses
                            transform: [{
                                translateX: Animated.add(translateX, new Animated.Value(-screenWidth))
                            }]
                        }
                    ]}
                >
                    {/* Previous Verse */}
                    <View style={styles.verseContainer}>
                        {visibleVerses.previous ? (
                            <ScrollView
                                style={styles.scrollView}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                                scrollEnabled={!isAnimating}
                            >
                                <Verse
                                    verse={visibleVerses.previous}
                                    isPlaying={false} // Previous verse shouldn't show as playing
                                    onPlayPress={playVerse}
                                    surahVerseCount={verses.length}
                                    showBookmarkButton={!!user}
                                />
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyVerseContainer}>
                                <Text style={styles.emptyVerseText}>İlk ayet</Text>
                            </View>
                        )}
                    </View>

                    {/* Current Verse */}
                    <View style={styles.verseContainer}>
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            scrollEnabled={!isAnimating}
                        >
                            <Verse
                                verse={visibleVerses.current}
                                isPlaying={audioState?.currentVerse?.id === visibleVerses.current?.id && audioState?.isPlaying}
                                onPlayPress={playVerse}
                                surahVerseCount={verses.length}
                                showBookmarkButton={!!user}
                            />
                        </ScrollView>
                    </View>

                    {/* Next Verse */}
                    <View style={styles.verseContainer}>
                        {visibleVerses.next ? (
                            <ScrollView
                                style={styles.scrollView}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                                scrollEnabled={!isAnimating}
                            >
                                <Verse
                                    verse={visibleVerses.next}
                                    isPlaying={false} // Next verse shouldn't show as playing
                                    onPlayPress={playVerse}
                                    surahVerseCount={verses.length}
                                    showBookmarkButton={!!user}
                                />
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyVerseContainer}>
                                <Text style={styles.emptyVerseText}>Son ayet</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </View>

            {/* Remove the duplicate navigation controls since they're already in header */}

            {/* Page indicator dots */}
            <View style={styles.pageIndicator}>
                {(() => {
                    const maxDots = 7; // Maximum number of dots to show
                    const totalVerses = verses.length;

                    if (totalVerses <= maxDots) {
                        // Show all verses if they fit
                        return verses.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentVerseIndex && styles.activeDot
                                ]}
                                onPress={() => goToVerse(index, true, true)}
                                disabled={isAnimating}
                            />
                        ));
                    }

                    // Dynamic range calculation
                    const sideCount = Math.floor((maxDots - 1) / 2); // Number of dots on each side of current
                    let startIndex = Math.max(0, currentVerseIndex - sideCount);
                    let endIndex = Math.min(totalVerses - 1, currentVerseIndex + sideCount);

                    // Adjust if we're near the beginning or end
                    if (endIndex - startIndex + 1 < maxDots) {
                        if (startIndex === 0) {
                            endIndex = Math.min(totalVerses - 1, startIndex + maxDots - 1);
                        } else if (endIndex === totalVerses - 1) {
                            startIndex = Math.max(0, endIndex - maxDots + 1);
                        }
                    }

                    const result = [];

                    // Show first dot and ellipsis if we're not at the beginning
                    if (startIndex > 0) {
                        result.push(
                            <TouchableOpacity
                                key={0}
                                style={[styles.dot, 0 === currentVerseIndex && styles.activeDot]}
                                onPress={() => goToVerse(0, true, true)}
                                disabled={isAnimating}
                            />
                        );
                        if (startIndex > 1) {
                            result.push(
                                <Text key="leftEllipsis" style={styles.ellipsis}>...</Text>
                            );
                        }
                    }

                    // Show the main range
                    for (let i = startIndex; i <= endIndex; i++) {
                        result.push(
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.dot,
                                    i === currentVerseIndex && styles.activeDot
                                ]}
                                onPress={() => goToVerse(i, true, true)}
                                disabled={isAnimating}
                            />
                        );
                    }

                    // Show ellipsis and last dot if we're not at the end
                    if (endIndex < totalVerses - 1) {
                        if (endIndex < totalVerses - 2) {
                            result.push(
                                <Text key="rightEllipsis" style={styles.ellipsis}>...</Text>
                            );
                        }
                        result.push(
                            <TouchableOpacity
                                key={totalVerses - 1}
                                style={[styles.dot, totalVerses - 1 === currentVerseIndex && styles.activeDot]}
                                onPress={() => goToVerse(totalVerses - 1, true, true)}
                                disabled={isAnimating}
                            />
                        );
                    }

                    return result;
                })()}
            </View>

            {/* Swipe instruction */}
            <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                    {isMobileScreen ? '← Kısa kaydır → ' : '← Kaydır → '}veya butonları kullan
                </Text>
            </View>

            {/* Go to Verse Modal */}
            <GoToVerseModal
                visible={isGoToVerseModalVisible}
                verses={verses}
                currentVerseIndex={currentVerseIndex}
                onVerseSelect={(verseIndex) => {
                    goToVerse(verseIndex, true, true); // Mark as user manual
                }}
                onClose={() => setIsGoToVerseModalVisible(false)}
            />
        </SafeAreaView>
    );
});

const createStyles = (theme: Theme, screenWidth: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: theme.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    navButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 8,
        backgroundColor: theme.primary,
        minWidth: 80,
    },
    navButtonDisabled: {
        backgroundColor: theme.textSecondary + '30',
    },
    navButtonText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
    },
    navButtonTextDisabled: {
        color: theme.textSecondary,
    },
    verseInfo: {
        alignItems: 'center',
        flex: 1,
    },
    verseNumberButton: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.primary,
        borderWidth: 2,
        borderColor: '#ffffff30',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        // 3D effect with inner shadow simulation
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.2)',
        borderRightColor: 'rgba(0, 0, 0, 0.2)',
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
        borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    },
    verseNumberButtonText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    verseTotal: {
        fontSize: 14,
        fontWeight: '400',
        color: '#FFFFFF',
        opacity: 0.75,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    verseCounter: {
        fontSize: FONT_SIZES.small,
        color: '#FFFFFF',
        marginTop: 4,
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden', // Prevent content from showing outside bounds during animation
    },
    animatedContainer: {
        flex: 1,
        width: '100%',
    },
    verseContainer: {
        width: screenWidth,
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.md,
        minHeight: '100%',
        justifyContent: 'center',
    },
    emptyVerseContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    emptyVerseText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    errorText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    pageIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        backgroundColor: theme.cardBackground,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.textSecondary + '40',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: theme.primary,
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    ellipsis: {
        color: theme.textSecondary,
        fontSize: FONT_SIZES.small,
        marginHorizontal: 4,
        lineHeight: 12,
    },
    moreIndicator: {
        color: theme.textSecondary,
        fontSize: FONT_SIZES.small,
        marginLeft: SPACING.xs,
    },
    instructionContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        backgroundColor: theme.cardBackground,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    instructionText: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
});
