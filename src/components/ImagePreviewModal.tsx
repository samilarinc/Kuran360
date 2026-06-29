import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Image,
    Platform,
    Alert,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { NativeVerseImageDesign } from './NativeVerseImageDesign';

// Web globals
declare const window: any;
declare const navigator: any;
declare const ClipboardItem: any;
import { useTheme, Theme } from '../contexts/ThemeContext';
import { VerseShareData, ImageSize } from '../types';
import { ShareService } from '../utils/shareUtils';
import { FONT_SIZES, SPACING } from '../constants';
import { IMAGE_SIZES } from '../utils/imageSizes';
import { useSettings } from '../contexts/SettingsContext';
import { ARABIC_FONT_OPTIONS, DEFAULT_IMAGE_FONT_ID, getFontOption, loadGoogleFont } from '../constants/fonts';

interface ImagePreviewModalProps {
    isVisible: boolean;
    onClose: () => void;
    imageUrl: string;
    verseData: VerseShareData;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    isVisible,
    onClose,
    imageUrl,
    verseData,
}) => {
    const { settings } = useSettings();
    const [selectedFontId, setSelectedFontId] = React.useState(settings.imageArabicFont ?? DEFAULT_IMAGE_FONT_ID);
    const [fontScale, setFontScale] = React.useState(1.0);
    const { theme } = useTheme();
    const [currentImage, setCurrentImage] = React.useState(imageUrl);
    const [mode, setMode] = React.useState<'light' | 'dark'>('light');
    const [selectedSize, setSelectedSize] = React.useState<ImageSize>(IMAGE_SIZES[6]); // Default to classic
    const [isGenerating, setIsGenerating] = React.useState(false);
    const viewShotRef = React.useRef<any>(null);

    React.useEffect(() => {
        setCurrentImage(imageUrl);
    }, [imageUrl]);

    const regenerateImage = async (themeMode: 'light' | 'dark', size: ImageSize, fontId?: string, scale?: number) => {
        const useFontId = fontId ?? selectedFontId;
        const useScale = scale ?? fontScale;
        const fontOption = getFontOption(useFontId);
        const fontCss = fontOption.css;
        setIsGenerating(true);

        // Inject Google Fonts link then wait for the specific font to load
        loadGoogleFont(fontOption);
        if (typeof document !== 'undefined' && document.fonts?.load) {
            try {
                await document.fonts.load(`16px ${fontCss}`);
            } catch (_) {}
        }

        try {
            if (Platform.OS === 'web') {
                const img = await ShareService.generateVerseImageForSharing(verseData, {
                    themeMode,
                    size,
                    arabicFontCss: fontCss,
                    fontScale: useScale,
                });
                if (img) {
                    setCurrentImage(img);
                    setMode(themeMode);
                    setSelectedSize(size);
                }
            } else {
                // Wait for state updates to reflect in NativeVerseImageDesign
                setMode(themeMode);
                setSelectedSize(size);

                // Wait a bit for the hidden view to re-render with new props
                setTimeout(async () => {
                    try {
                        if (!viewShotRef.current) {
                            throw new Error('ViewShot ref is not attached');
                        }
                        const uri = await captureRef(viewShotRef.current, {
                            format: 'png',
                            quality: 0.9,
                        });
                        setCurrentImage(uri);
                    } catch (error) {
                        console.error('Native capture error:', error);
                        Alert.alert('Hata', 'Görüntü oluşturulamadı.');
                    }
                    setIsGenerating(false);
                }, 150);
                return; // Early return because of setTimeout
            }
        } catch (error) {
            console.error('Resim yeniden oluşturma hatası:', error);
            Alert.alert('Hata', 'Resim oluşturulamadı. Lütfen tekrar deneyin.');
        }
        setIsGenerating(false);
    };

    const handleDownload = () => {
        if (Platform.OS === 'web') {
            ShareService.downloadImageAsBlob(imageUrl, verseData);
        } else {
            Alert.alert('Bilgi', 'Resmi kaydetmek için paylaş seçeneklerini kullanabilirsiniz.');
        }
    };

    const handleCopy = async () => {
        try {
            if (Platform.OS === 'web' && navigator.clipboard && navigator.clipboard.write) {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                Alert.alert('Başarılı', 'Resim panoya kopyalandı!');
            } else {
                Alert.alert('Bilgi', 'Bu özellik sadece modern tarayıcılarda çalışır.');
            }
        } catch (error) {
            console.error('Kopyalama hatası:', error);
            Alert.alert('Hata', 'Resim kopyalanamadı.');
        }
    };

    const handleOpenInNewTab = () => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(imageUrl, '_blank');
        }
    };

    const handlePlatformShare = async (platformId: string) => {
        try {
            const url = ShareService.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);

            if (platformId === 'generic') {
                await ShareService.shareVerse(verseData);
            } else {
                ShareService.shareToSocialPlatform(platformId, imageUrl, url);
            }
        } catch (error) {
            console.error('Paylaşım hatası:', error);
        }
    };

    const platforms = [
        { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
        { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
        { id: 'telegram', name: 'Telegram', icon: '✈️' },
        { id: 'facebook', name: 'Facebook', icon: '📘' },
        { id: 'generic', name: 'Diğer Uygulamalar', icon: '📤' },
    ];

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container}>
                    <View style={[styles.modal, { backgroundColor: theme.background }]}>

                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.text }]}>
                                Ayet Resmi
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                            {/* Image Preview */}
                            <View style={[styles.imageContainer, { backgroundColor: theme.surface }]}>
                                <Image
                                    source={{ uri: currentImage }}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Font Selection */}
                            <View style={styles.controlSection}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Yazı Tipi</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                                    <View style={styles.sizeRow}>
                                        {ARABIC_FONT_OPTIONS.map(font => {
                                            const isSelected = selectedFontId === font.id;
                                            return (
                                                <TouchableOpacity
                                                    key={font.id}
                                                    disabled={isGenerating}
                                                    style={[
                                                        styles.sizeButton,
                                                        { backgroundColor: isSelected ? theme.primary : theme.cardBackground },
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedFontId(font.id);
                                                        regenerateImage(mode, selectedSize, font.id, fontScale);
                                                    }}
                                                >
                                                    <Text style={{ color: isSelected ? '#fff' : theme.text, fontSize: 20, fontFamily: Platform.OS === 'web' ? font.css : undefined }}>
                                                        {font.labelAr}
                                                    </Text>
                                                    <Text style={{ color: isSelected ? '#fff' : theme.textSecondary, fontSize: 10, marginTop: 2 }}>
                                                        {font.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Font Scale */}
                            <View style={styles.controlSection}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Yazı Boyutu ({Math.round(fontScale * 100)}%)
                                </Text>
                                <View style={styles.controlRow}>
                                    <TouchableOpacity
                                        style={[styles.controlButton, { backgroundColor: theme.cardBackground, flex: 1 }]}
                                        disabled={isGenerating || fontScale <= 0.5}
                                        onPress={() => {
                                            const s = Math.max(0.5, Math.round((fontScale - 0.1) * 10) / 10);
                                            setFontScale(s);
                                            regenerateImage(mode, selectedSize, selectedFontId, s);
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '700' }}>A−</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.controlButton, { backgroundColor: theme.cardBackground, flex: 1 }]}
                                        disabled={isGenerating}
                                        onPress={() => {
                                            setFontScale(1.0);
                                            regenerateImage(mode, selectedSize, selectedFontId, 1.0);
                                        }}
                                    >
                                        <Text style={[styles.actionText, { color: theme.text, fontSize: 12 }]}>Sıfırla</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.controlButton, { backgroundColor: theme.cardBackground, flex: 1 }]}
                                        disabled={isGenerating || fontScale >= 2.0}
                                        onPress={() => {
                                            const s = Math.min(2.0, Math.round((fontScale + 0.1) * 10) / 10);
                                            setFontScale(s);
                                            regenerateImage(mode, selectedSize, selectedFontId, s);
                                        }}
                                    >
                                        <Text style={{ fontSize: 20, color: theme.text, fontWeight: '700' }}>A+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Theme Selection */}
                            <View style={styles.controlSection}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Tema Seçimi
                                </Text>
                                <View style={styles.controlRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            { backgroundColor: theme.cardBackground },
                                            mode === 'light' && { backgroundColor: theme.primary }
                                        ]}
                                        onPress={() => regenerateImage('light', selectedSize)}
                                        disabled={isGenerating}
                                    >
                                        <Text style={styles.actionIcon}>🔆</Text>
                                        <Text style={[
                                            styles.actionText,
                                            { color: mode === 'light' ? '#fff' : theme.text }
                                        ]}>
                                            Light
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            { backgroundColor: theme.cardBackground },
                                            mode === 'dark' && { backgroundColor: theme.primary }
                                        ]}
                                        onPress={() => regenerateImage('dark', selectedSize)}
                                        disabled={isGenerating}
                                    >
                                        <Text style={styles.actionIcon}>🌙</Text>
                                        <Text style={[
                                            styles.actionText,
                                            { color: mode === 'dark' ? '#fff' : theme.text }
                                        ]}>
                                            Dark
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Size Selection */}
                            <View style={styles.controlSection}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Boyut Seçimi
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                                    <View style={styles.sizeRow}>
                                        {IMAGE_SIZES.map((size) => (
                                            <TouchableOpacity
                                                key={size.id}
                                                style={[
                                                    styles.sizeButton,
                                                    { backgroundColor: theme.cardBackground },
                                                    selectedSize.id === size.id && { backgroundColor: theme.primary }
                                                ]}
                                                onPress={() => regenerateImage(mode, size)}
                                                disabled={isGenerating}
                                            >
                                                <Text style={styles.sizeIcon}>{size.icon}</Text>
                                                <Text style={[
                                                    styles.sizeTitle,
                                                    { color: selectedSize.id === size.id ? '#fff' : theme.text }
                                                ]}>
                                                    {size.displayName}
                                                </Text>
                                                <Text style={[
                                                    styles.sizeDescription,
                                                    { color: selectedSize.id === size.id ? '#fff' : theme.textSecondary }
                                                ]}>
                                                    {size.description}
                                                </Text>
                                                <Text style={[
                                                    styles.sizeDimensions,
                                                    { color: selectedSize.id === size.id ? '#fff' : theme.textSecondary }
                                                ]}>
                                                    {size.width}×{size.height}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {isGenerating && (
                                <View style={styles.loadingContainer}>
                                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                                        🔄 Resim oluşturuluyor...
                                    </Text>
                                </View>
                            )}

                            {/* Image Actions */}
                            <View style={styles.actionsContainer}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Resim İşlemleri
                                </Text>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                                        onPress={handleDownload}
                                    >
                                        <Text style={styles.actionIcon}>📥</Text>
                                        <Text style={[styles.actionText, { color: theme.text }]}>İndir</Text>
                                    </TouchableOpacity>

                                    {Platform.OS === 'web' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                                                onPress={handleCopy}
                                            >
                                                <Text style={styles.actionIcon}>📋</Text>
                                                <Text style={[styles.actionText, { color: theme.text }]}>Kopyala</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                                                onPress={handleOpenInNewTab}
                                            >
                                                <Text style={styles.actionIcon}>🔗</Text>
                                                <Text style={[styles.actionText, { color: theme.text }]}>Yeni Sekmede Aç</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Share Platforms */}
                            <View style={styles.shareContainer}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Paylaş
                                </Text>

                                <View style={styles.platformList}>
                                    {platforms.map((platform) => (
                                        <TouchableOpacity
                                            key={platform.id}
                                            style={[styles.platformButton, { backgroundColor: theme.cardBackground }]}
                                            onPress={() => handlePlatformShare(platform.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.platformIcon}>{platform.icon}</Text>
                                            <Text style={[styles.platformName, { color: theme.text }]}>
                                                {platform.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Verse Info */}
                            <View style={[styles.verseInfo, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.verseInfoText, { color: theme.textSecondary }]}>
                                    📖 {verseData.surahName} Suresi, {verseData.verseNumber}. Ayet
                                </Text>
                            </View>

                        </ScrollView>
                    </View>
                </SafeAreaView>
            </View>

            {/* Hidden view for capturing on Native */}
            {Platform.OS !== 'web' && (
                <View style={{ position: 'absolute', left: -9999, top: 0, opacity: 0 }}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                        <NativeVerseImageDesign
                            verseData={verseData}
                            themeMode={mode}
                            size={selectedSize}
                        />
                    </ViewShot>
                </View>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    modal: {
        borderRadius: 20,
        maxHeight: '90%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        margin: SPACING.lg,
        borderRadius: 12,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 8,
    },
    controlSection: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    controlRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        justifyContent: 'center',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    sizeScrollView: {
        marginVertical: SPACING.sm,
    },
    sizeRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    sizeButton: {
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 120,
        maxWidth: 140,
    },
    sizeIcon: {
        fontSize: 24,
        marginBottom: SPACING.xs,
    },
    sizeTitle: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    sizeDescription: {
        fontSize: FONT_SIZES.small - 2,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    sizeDimensions: {
        fontSize: FONT_SIZES.small - 2,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    loadingText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
    },
    actionsContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        minWidth: 100,
    },
    actionIcon: {
        fontSize: 18,
        marginRight: SPACING.xs,
    },
    actionText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
    },
    shareContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    platformList: {
        gap: SPACING.sm,
    },
    platformButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
    },
    platformIcon: {
        fontSize: 20,
        marginRight: SPACING.md,
    },
    platformName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '500',
    },
    verseInfo: {
        margin: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    verseInfoText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
});
