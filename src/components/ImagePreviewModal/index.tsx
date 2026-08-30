import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    SafeAreaView,
    Image,
    Platform,
    Alert,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Sun, Moon, RefreshCw, Download, Copy, ExternalLink, BookOpen, Share2 } from 'lucide-react-native';
import { NativeVerseImageDesign } from '../NativeVerseImageDesign';
import { PlatformIcon } from '../PlatformIcon';

// Web globals
declare const window: any;
declare const navigator: any;
declare const ClipboardItem: any;
import { useTheme } from '@/contexts/ThemeContext';
import { VerseShareData, ImageSize, IconSpec } from '@/types';
import { ShareService } from '@/utils/shareUtils';
import { IMAGE_SIZES } from '@/utils/imageSizes';
import { useSettings } from '@/contexts/SettingsContext';
import { formatVerseNumber } from '@/utils/numerals';
import { ARABIC_FONT_OPTIONS, DEFAULT_IMAGE_FONT_ID, getFontOption, getArabicFontFamily } from '@/constants/fonts';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

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
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);
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
        // Bundled via expo-font and loaded before the app renders (see App.tsx), so it's
        // already available here - no runtime font loading needed.
        const fontCss = getArabicFontFamily(fontOption);
        setIsGenerating(true);

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

    const platforms: Array<{ id: string; name: string; icon: IconSpec }> = [
        { id: 'whatsapp', name: 'WhatsApp', icon: { kind: 'brand', name: 'whatsapp' } },
        { id: 'twitter', name: 'Twitter/X', icon: { kind: 'brand', name: 'x-twitter' } },
        { id: 'telegram', name: 'Telegram', icon: { kind: 'brand', name: 'telegram' } },
        { id: 'facebook', name: 'Facebook', icon: { kind: 'brand', name: 'facebook' } },
        { id: 'generic', name: 'Diğer Uygulamalar', icon: { kind: 'lucide', Icon: Share2 } },
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
                    <View style={styles.modal}>

                        {/* Header */}
                        <View style={common.modalHeader}>
                            <Text style={common.modalHeaderTitle}>
                                Ayet Resmi
                            </Text>
                            <TouchableOpacity onPress={onClose} style={common.modalCloseButton}>
                                <Text style={common.modalCloseButtonText}>
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={common.flex1} showsVerticalScrollIndicator={false}>

                            {/* Image Preview */}
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: currentImage }}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Font Selection */}
                            <View style={styles.controlSection}>
                                <Text style={styles.sectionTitle}>Yazı Tipi</Text>
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
                                                        isSelected && styles.sizeButtonSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedFontId(font.id);
                                                        regenerateImage(mode, selectedSize, font.id, fontScale);
                                                    }}
                                                >
                                                    <Text style={[
                                                        isSelected ? styles.fontLabelArSelected : styles.fontLabelArDefault,
                                                        { fontFamily: getArabicFontFamily(font) },
                                                    ]}>
                                                        {font.labelAr}
                                                    </Text>
                                                    <Text style={isSelected ? styles.fontLabelTrSelected : styles.fontLabelTrDefault}>
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
                                <Text style={styles.sectionTitle}>
                                    Yazı Boyutu ({Math.round(fontScale * 100)}%)
                                </Text>
                                <View style={styles.controlRow}>
                                    <TouchableOpacity
                                        style={[styles.controlButton, styles.controlButtonBg, common.flex1]}
                                        disabled={isGenerating || fontScale <= 0.5}
                                        onPress={() => {
                                            const s = Math.max(0.5, Math.round((fontScale - 0.1) * 10) / 10);
                                            setFontScale(s);
                                            regenerateImage(mode, selectedSize, selectedFontId, s);
                                        }}
                                    >
                                        <Text style={styles.scaleButtonTextSmall}>A−</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.controlButton, styles.controlButtonBg, common.flex1]}
                                        disabled={isGenerating}
                                        onPress={() => {
                                            setFontScale(1.0);
                                            regenerateImage(mode, selectedSize, selectedFontId, 1.0);
                                        }}
                                    >
                                        <Text style={[styles.actionText, styles.actionTextSmall]}>Sıfırla</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.controlButton, styles.controlButtonBg, common.flex1]}
                                        disabled={isGenerating || fontScale >= 2.0}
                                        onPress={() => {
                                            const s = Math.min(2.0, Math.round((fontScale + 0.1) * 10) / 10);
                                            setFontScale(s);
                                            regenerateImage(mode, selectedSize, selectedFontId, s);
                                        }}
                                    >
                                        <Text style={styles.scaleButtonTextLarge}>A+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Theme Selection */}
                            <View style={styles.controlSection}>
                                <Text style={styles.sectionTitle}>
                                    Tema Seçimi
                                </Text>
                                <View style={styles.controlRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            styles.controlButtonBg,
                                            mode === 'light' && styles.controlButtonActive
                                        ]}
                                        onPress={() => regenerateImage('light', selectedSize)}
                                        disabled={isGenerating}
                                    >
                                        <View style={styles.actionIcon}>
                                            <Sun size={16} color={mode === 'light' ? '#fff' : theme.text} />
                                        </View>
                                        <Text style={[
                                            styles.actionText,
                                            mode === 'light' && styles.textOnPrimary
                                        ]}>
                                            Light
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            styles.controlButtonBg,
                                            mode === 'dark' && styles.controlButtonActive
                                        ]}
                                        onPress={() => regenerateImage('dark', selectedSize)}
                                        disabled={isGenerating}
                                    >
                                        <View style={styles.actionIcon}>
                                            <Moon size={16} color={mode === 'dark' ? '#fff' : theme.text} />
                                        </View>
                                        <Text style={[
                                            styles.actionText,
                                            mode === 'dark' && styles.textOnPrimary
                                        ]}>
                                            Dark
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Size Selection */}
                            <View style={styles.controlSection}>
                                <Text style={styles.sectionTitle}>
                                    Boyut Seçimi
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                                    <View style={styles.sizeRow}>
                                        {IMAGE_SIZES.map((size) => (
                                            <TouchableOpacity
                                                key={size.id}
                                                style={[
                                                    styles.sizeButton,
                                                    selectedSize.id === size.id && styles.sizeButtonSelected
                                                ]}
                                                onPress={() => regenerateImage(mode, size)}
                                                disabled={isGenerating}
                                            >
                                                <View style={styles.sizeIcon}>
                                                    <PlatformIcon
                                                        spec={size.icon}
                                                        size={22}
                                                        color={selectedSize.id === size.id ? '#fff' : theme.text}
                                                    />
                                                </View>
                                                <Text style={[
                                                    styles.sizeTitle,
                                                    selectedSize.id === size.id && styles.textOnPrimary
                                                ]}>
                                                    {size.displayName}
                                                </Text>
                                                <Text style={[
                                                    styles.sizeDescription,
                                                    selectedSize.id === size.id && styles.textOnPrimary
                                                ]}>
                                                    {size.description}
                                                </Text>
                                                <Text style={[
                                                    styles.sizeDimensions,
                                                    selectedSize.id === size.id && styles.textOnPrimary
                                                ]}>
                                                    {size.width}×{size.height}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {isGenerating && (
                                <View style={[styles.loadingContainer, common.row, common.center]}>
                                    <RefreshCw size={14} color={theme.textSecondary} />
                                    <Text style={[styles.loadingText, styles.loadingTextSpacing]}>
                                        Resim oluşturuluyor...
                                    </Text>
                                </View>
                            )}

                            {/* Image Actions */}
                            <View style={styles.actionsContainer}>
                                <Text style={styles.sectionTitle}>
                                    Resim İşlemleri
                                </Text>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleDownload}
                                    >
                                        <View style={styles.actionIcon}>
                                            <Download size={16} color={theme.text} />
                                        </View>
                                        <Text style={styles.actionText}>İndir</Text>
                                    </TouchableOpacity>

                                    {Platform.OS === 'web' && (
                                        <>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={handleCopy}
                                            >
                                                <View style={styles.actionIcon}>
                                                    <Copy size={16} color={theme.text} />
                                                </View>
                                                <Text style={styles.actionText}>Kopyala</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={handleOpenInNewTab}
                                            >
                                                <View style={styles.actionIcon}>
                                                    <ExternalLink size={16} color={theme.text} />
                                                </View>
                                                <Text style={styles.actionText}>Yeni Sekmede Aç</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Share Platforms */}
                            <View style={styles.shareContainer}>
                                <Text style={styles.sectionTitle}>
                                    Paylaş
                                </Text>

                                <View style={styles.platformList}>
                                    {platforms.map((platform) => (
                                        <TouchableOpacity
                                            key={platform.id}
                                            style={styles.platformButton}
                                            onPress={() => handlePlatformShare(platform.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.platformIcon}>
                                                <PlatformIcon spec={platform.icon} size={20} color={theme.text} />
                                            </View>
                                            <Text style={styles.platformName}>
                                                {platform.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Verse Info */}
                            <View style={[styles.verseInfo, common.row, common.center]}>
                                <BookOpen size={14} color={theme.textSecondary} />
                                <Text style={[styles.verseInfoText, styles.verseInfoTextSpacing]}>
                                    {verseData.surahName} Suresi, {formatVerseNumber(verseData.verseNumber, settings.verseNumberStyle)}. Ayet
                                </Text>
                            </View>

                        </ScrollView>
                    </View>
                </SafeAreaView>
            </View>

            {/* Hidden view for capturing on Native */}
            {Platform.OS !== 'web' && (
                <View style={styles.hiddenCapture}>
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

