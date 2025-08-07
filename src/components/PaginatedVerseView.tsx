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
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700; // Phones with height less than 700dp
const isMobileScreen = screenWidth < 768; // Mobile vs tablet threshold

interface PaginatedVerseViewProps {
    verses: VerseType[];
    initialVerseIndex?: number;
    onVerseChange?: (verseIndex: number) => void;
    onPlayAudio?: (verse: VerseType) => void;
    audioState?: any;
}

export const PaginatedVerseView: React.FC<PaginatedVerseViewProps> = ({
    verses,
    initialVerseIndex = 0,
    onVerseChange,
    onPlayAudio,
    audioState,
}) => {
    const { settings, updateSettings } = useSettings();
    const { theme } = useTheme();
    const [currentVerseIndex, setCurrentVerseIndex] = useState(initialVerseIndex);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isGoToVerseModalVisible, setIsGoToVerseModalVisible] = useState(false);
    
    // Animation values
    const translateX = useRef(new Animated.Value(0)).current;
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Mark as initialized after first render to avoid calling onVerseChange on mount
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        // Update currentVerseIndex when initialVerseIndex changes (e.g., from URL)
        if (initialVerseIndex !== currentVerseIndex) {
            setCurrentVerseIndex(initialVerseIndex);
        }
    }, [initialVerseIndex]);

    useEffect(() => {
        // Only call onVerseChange after initialization and when user manually changes verse
        if (isInitialized && onVerseChange) {
            onVerseChange(currentVerseIndex);
        }
    }, [currentVerseIndex, isInitialized]); // Remove onVerseChange from dependencies

    // Auto-follow effect: Navigate to verse when audio is playing and tracking is enabled
    useEffect(() => {
        if (audioState?.currentVerse && 
            audioState.isPlaying && 
            isInitialized && 
            settings.audioTrackingEnabled) {
            
            // Debounce to prevent excessive navigation
            const timeoutId = setTimeout(() => {
                // Find the index of the currently playing verse
                const playingVerseIndex = verses.findIndex(verse =>
                    verse.surahNumber === audioState.currentVerse.surahNumber &&
                    verse.number === audioState.currentVerse.number
                );

                // Only navigate if the playing verse is different from current verse
                if (playingVerseIndex !== -1 && playingVerseIndex !== currentVerseIndex) {
                    setCurrentVerseIndex(playingVerseIndex);
                }
            }, 100); // 100ms debounce

            return () => clearTimeout(timeoutId);
        }
    }, [audioState?.currentVerse, audioState?.isPlaying, verses, currentVerseIndex, isInitialized, settings.audioTrackingEnabled]);

    const goToVerse = (index: number, animated: boolean = true) => {
        if (index >= 0 && index < verses.length && !isAnimating) {
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
            goToVerse(currentVerseIndex - 1);
        }
    };

    const goToNext = () => {
        if (currentVerseIndex < verses.length - 1) {
            goToVerse(currentVerseIndex + 1);
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
            // Start interaction
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
                Animated.timing(translateX, {
                    toValue: screenWidth,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentVerseIndex(currentVerseIndex - 1);
                    translateX.setValue(0);
                    setIsAnimating(false);
                });
            } else if (dx < -threshold && currentVerseIndex < verses.length - 1) {
                // Swipe left - go to next
                Animated.timing(translateX, {
                    toValue: -screenWidth,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentVerseIndex(currentVerseIndex + 1);
                    translateX.setValue(0);
                    setIsAnimating(false);
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

    if (!currentVerse) {
        return (
            <SafeAreaView style={createStyles(theme).container}>
                <View style={createStyles(theme).errorContainer}>
                    <Text style={createStyles(theme).errorText}>Ayet bulunamadı</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={createStyles(theme).container}>
            {/* Header with verse info and navigation */}
            <View style={createStyles(theme).header}>
                <TouchableOpacity
                    style={[createStyles(theme).navButton, (currentVerseIndex === 0 || isAnimating) && createStyles(theme).navButtonDisabled]}
                    onPress={goToPrevious}
                    disabled={currentVerseIndex === 0 || isAnimating}
                >
                    <Text style={[createStyles(theme).navButtonText, (currentVerseIndex === 0 || isAnimating) && createStyles(theme).navButtonTextDisabled]}>
                        ← Önceki
                    </Text>
                </TouchableOpacity>

                <View style={createStyles(theme).verseInfo}>
                    <TouchableOpacity
                        style={createStyles(theme).verseNumberButton}
                        onPress={() => setIsGoToVerseModalVisible(true)}
                    >
                        <Text style={createStyles(theme).verseNumberButtonText}>
                            Ayet {currentVerse.number}
                        </Text>
                        <Text style={createStyles(theme).verseCounter}>
                            {currentVerseIndex + 1} / {verses.length}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[createStyles(theme).navButton, (currentVerseIndex === verses.length - 1 || isAnimating) && createStyles(theme).navButtonDisabled]}
                    onPress={goToNext}
                    disabled={currentVerseIndex === verses.length - 1 || isAnimating}
                >
                    <Text style={[createStyles(theme).navButtonText, (currentVerseIndex === verses.length - 1 || isAnimating) && createStyles(theme).navButtonTextDisabled]}>
                        Sonraki →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Verse content with animated swipe gesture */}
            <View style={createStyles(theme).contentContainer} {...panResponder.panHandlers}>
                <Animated.View 
                    style={[
                        createStyles(theme).animatedContainer,
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
                    <View style={createStyles(theme).verseContainer}>
                        {visibleVerses.previous ? (
                            <ScrollView
                                style={createStyles(theme).scrollView}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={createStyles(theme).scrollContent}
                                scrollEnabled={!isAnimating}
                            >
                                <Verse
                                    verse={visibleVerses.previous}
                                    isPlaying={false} // Previous verse shouldn't show as playing
                                    onPlayPress={onPlayAudio || (() => { })}
                                />
                            </ScrollView>
                        ) : (
                            <View style={createStyles(theme).emptyVerseContainer}>
                                <Text style={createStyles(theme).emptyVerseText}>İlk ayet</Text>
                            </View>
                        )}
                    </View>

                    {/* Current Verse */}
                    <View style={createStyles(theme).verseContainer}>
                        <ScrollView
                            style={createStyles(theme).scrollView}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={createStyles(theme).scrollContent}
                            scrollEnabled={!isAnimating}
                        >
                            <Verse
                                verse={visibleVerses.current}
                                isPlaying={audioState?.currentVerse?.id === visibleVerses.current?.id && audioState?.isPlaying}
                                onPlayPress={onPlayAudio || (() => { })}
                            />
                        </ScrollView>
                    </View>

                    {/* Next Verse */}
                    <View style={createStyles(theme).verseContainer}>
                        {visibleVerses.next ? (
                            <ScrollView
                                style={createStyles(theme).scrollView}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={createStyles(theme).scrollContent}
                                scrollEnabled={!isAnimating}
                            >
                                <Verse
                                    verse={visibleVerses.next}
                                    isPlaying={false} // Next verse shouldn't show as playing
                                    onPlayPress={onPlayAudio || (() => { })}
                                />
                            </ScrollView>
                        ) : (
                            <View style={createStyles(theme).emptyVerseContainer}>
                                <Text style={createStyles(theme).emptyVerseText}>Son ayet</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </View>

            {/* Remove the duplicate navigation controls since they're already in header */}

            {/* Page indicator dots */}
            <View style={createStyles(theme).pageIndicator}>
                {verses.slice(0, Math.min(verses.length, 10)).map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            createStyles(theme).dot,
                            index === currentVerseIndex && createStyles(theme).activeDot
                        ]}
                        onPress={() => goToVerse(index, true)}
                        disabled={isAnimating}
                    />
                ))}
                {verses.length > 10 && (
                    <Text style={createStyles(theme).moreIndicator}>...</Text>
                )}
            </View>

            {/* Swipe instruction */}
            <View style={createStyles(theme).instructionContainer}>
                <Text style={createStyles(theme).instructionText}>
                    {isMobileScreen ? '← Kısa kaydır → ' : '← Kaydır → '}veya butonları kullan
                </Text>
            </View>

            {/* Go to Verse Modal */}
            <GoToVerseModal
                visible={isGoToVerseModalVisible}
                verses={verses}
                currentVerseIndex={currentVerseIndex}
                onVerseSelect={(verseIndex) => {
                    goToVerse(verseIndex, true);
                }}
                onClose={() => setIsGoToVerseModalVisible(false)}
            />
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 8,
        backgroundColor: theme.primary + '10',
        borderWidth: 1,
        borderColor: theme.primary + '20',
    },
    verseNumberButtonText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.primary,
    },
    verseCounter: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        marginTop: 2,
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
