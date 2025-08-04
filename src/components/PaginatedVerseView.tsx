import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    PanResponder,
} from 'react-native';
import { Verse } from './Verse';
import { GoToVerseModal } from './GoToVerseModal';
import { Verse as VerseType } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

const { width: screenWidth } = Dimensions.get('window');

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
    const [currentVerseIndex, setCurrentVerseIndex] = useState(initialVerseIndex);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isGoToVerseModalVisible, setIsGoToVerseModalVisible] = useState(false);

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

    // Auto-follow effect: Navigate to verse when audio is playing
    useEffect(() => {
        if (audioState?.currentVerse && audioState.isPlaying && isInitialized) {
            // Find the index of the currently playing verse
            const playingVerseIndex = verses.findIndex(verse =>
                verse.surahNumber === audioState.currentVerse.surahNumber &&
                verse.number === audioState.currentVerse.number
            );

            // Only navigate if the playing verse is different from current verse
            if (playingVerseIndex !== -1 && playingVerseIndex !== currentVerseIndex) {
                setCurrentVerseIndex(playingVerseIndex);
            }
        }
    }, [audioState?.currentVerse, audioState?.isPlaying, verses, currentVerseIndex, isInitialized]);

    const goToVerse = (index: number) => {
        if (index >= 0 && index < verses.length) {
            setCurrentVerseIndex(index);
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

    // Simple pan responder for swipe gestures
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
        },
        onPanResponderMove: () => {
            // Handle move if needed
        },
        onPanResponderRelease: (evt, gestureState) => {
            const { dx } = gestureState;
            const threshold = screenWidth * 0.25;

            if (dx > threshold && currentVerseIndex > 0) {
                // Swipe right - go to previous
                goToPrevious();
            } else if (dx < -threshold && currentVerseIndex < verses.length - 1) {
                // Swipe left - go to next
                goToNext();
            }
        },
    });

    const currentVerse = verses[currentVerseIndex];

    if (!currentVerse) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No verses available</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with verse info and navigation */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.navButton, currentVerseIndex === 0 && styles.navButtonDisabled]}
                    onPress={goToPrevious}
                    disabled={currentVerseIndex === 0}
                >
                    <Text style={[styles.navButtonText, currentVerseIndex === 0 && styles.navButtonTextDisabled]}>
                        ← Önceki
                    </Text>
                </TouchableOpacity>

                <View style={styles.verseInfo}>
                    <Text style={styles.verseNumber}>
                        Ayet {currentVerse.number}
                    </Text>
                    <Text style={styles.verseCounter}>
                        {currentVerseIndex + 1} / {verses.length}
                    </Text>
                    <TouchableOpacity
                        style={styles.goToVerseButton}
                        onPress={() => setIsGoToVerseModalVisible(true)}
                    >
                        <Text style={styles.goToVerseButtonText}>Git</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.navButton, currentVerseIndex === verses.length - 1 && styles.navButtonDisabled]}
                    onPress={goToNext}
                    disabled={currentVerseIndex === verses.length - 1}
                >
                    <Text style={[styles.navButtonText, currentVerseIndex === verses.length - 1 && styles.navButtonTextDisabled]}>
                        Sonraki →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Verse content with swipe gesture */}
            <View style={styles.contentContainer} {...panResponder.panHandlers}>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Verse
                        verse={currentVerse}
                        isPlaying={audioState?.currentVerse?.id === currentVerse.id && audioState?.isPlaying}
                        onPlayPress={onPlayAudio || (() => { })}
                    />
                </ScrollView>
            </View>

            {/* Page indicator dots */}
            <View style={styles.pageIndicator}>
                {verses.slice(0, Math.min(verses.length, 10)).map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.dot,
                            index === currentVerseIndex && styles.activeDot
                        ]}
                        onPress={() => goToVerse(index)}
                    />
                ))}
                {verses.length > 10 && (
                    <Text style={styles.moreIndicator}>...</Text>
                )}
            </View>

            {/* Swipe instruction */}
            <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                    ← Kaydır → veya butonları kullan
                </Text>
            </View>

            {/* Go to Verse Modal */}
            <GoToVerseModal
                visible={isGoToVerseModalVisible}
                verses={verses}
                currentVerseIndex={currentVerseIndex}
                onVerseSelect={(verseIndex) => {
                    setCurrentVerseIndex(verseIndex);
                }}
                onClose={() => setIsGoToVerseModalVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    navButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        minWidth: 80,
    },
    navButtonDisabled: {
        backgroundColor: COLORS.textSecondary + '30',
    },
    navButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
    },
    navButtonTextDisabled: {
        color: COLORS.textSecondary,
    },
    verseInfo: {
        alignItems: 'center',
        flex: 1,
    },
    verseNumber: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    verseCounter: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    goToVerseButton: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    goToVerseButtonText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    errorText: {
        fontSize: FONT_SIZES.medium,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    contentContainer: {
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
    pageIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.textSecondary + '40',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: COLORS.primary,
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    moreIndicator: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.small,
        marginLeft: SPACING.xs,
    },
    instructionContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
    },
    instructionText: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
});
