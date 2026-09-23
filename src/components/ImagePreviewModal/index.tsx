import React from 'react';
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
import { ImageSizePicker } from '../ImageSizePicker';
import { VerseVideoActions } from '../VerseVideoActions';

// Web globals
declare const window: any;
declare const navigator: any;
declare const ClipboardItem: any;
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { VerseShareData, ImageSize, IconSpec } from '@/types';
import { ShareService } from '@/utils/shareUtils';
import { getDefaultImageSize } from '@/utils/imageSizes';
import { useSettings } from '@/contexts/SettingsContext';
import { getVerseLabel } from '@/utils/verseRange';
import { ARABIC_FONT_OPTIONS, DEFAULT_IMAGE_FONT_ID, getFontOption, getArabicFontFamily } from '@/constants/fonts';
import { createStyles } from './index.styles';

interface ImagePreviewModalProps {
    isVisible: boolean;
    onClose: () => void;
    imageUrl: string;
    verseData: VerseShareData;
    /** Theme and size the incoming image was generated with, so the controls start in sync. */
    initialThemeMode?: 'light' | 'dark';
    initialSize?: ImageSize;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    isVisible,
    onClose,
    imageUrl,
    verseData,
    initialThemeMode = 'light',
    initialSize,
}) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const [selectedFontId, setSelectedFontId] = React.useState(settings.imageArabicFont ?? DEFAULT_IMAGE_FONT_ID);
    const [fontScale, setFontScale] = React.useState(1.0);
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [currentImage, setCurrentImage] = React.useState(imageUrl);
    const [mode, setMode] = React.useState<'light' | 'dark'>(initialThemeMode);
    const [selectedSize, setSelectedSize] = React.useState<ImageSize>(initialSize ?? getDefaultImageSize());
    const [isGenerating, setIsGenerating] = React.useState(false);
    const viewShotRef = React.useRef<any>(null);
    const selectedFont = getFontOption(selectedFontId);
    // A new image from ShareModal: reset controls to the options it was generated with
    React.useEffect(() => {
        setCurrentImage(imageUrl);
        if (!imageUrl) return;
        setMode(initialThemeMode);
        if (initialSize) setSelectedSize(initialSize);
        setSelectedFontId(settings.imageArabicFont ?? DEFAULT_IMAGE_FONT_ID);
        setFontScale(1.0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ShareService.downloadImageAsBlob(currentImage, verseData);
        } else {
            Alert.alert('Bilgi', 'Resmi kaydetmek için paylaş seçeneklerini kullanabilirsiniz.');
        }
    };

    const handleCopy = async () => {
        try {
            if (Platform.OS === 'web' && navigator.clipboard && navigator.clipboard.write) {
                const response = await fetch(currentImage);
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
            window.open(currentImage, '_blank');
        }
    };

    const handlePlatformShare = async (platformId: string) => {
        try {
            const url = ShareService.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);

            if (platformId === 'generic') {
                await ShareService.shareVerse(verseData);
            } else {
                ShareService.shareToSocialPlatform(platformId, currentImage, url);
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
                                <Text style={[common.textStrong, common.mbSm]}>Yazı Tipi</Text>
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
                                                        isSelected && common.buttonPrimary,
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedFontId(font.id);
                                                        regenerateImage(mode, selectedSize, font.id, fontScale);
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.fontLabelAr, isSelected && common.buttonTextPrimary,
                                                        { fontFamily: getArabicFontFamily(font) },
                                                    ]}>
                                                        {font.labelAr}
                                                    </Text>
                                                    <Text style={[styles.fontLabelTr, isSelected && common.buttonTextPrimary]}>
                                                        {font.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                                {Platform.OS !== 'web' && selectedFont.hasQuranMarks === false && (
                                    <Text style={[common.smallText, common.mtSm]}>{t('share.fontNoQuranMarks')}</Text>
                                )}
                            </View>

                            {/* Font Scale */}
                            <View style={styles.controlSection}>
                                <Text style={[common.textStrong, common.mbSm]}>
                                    Yazı Boyutu ({Math.round(fontScale * 100)}%)
                                </Text>
                                <View style={[common.rowGap, common.center]}>
                                    <TouchableOpacity
                                        style={[styles.controlButton, common.flex1]}
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
                                        style={[styles.controlButton, common.flex1]}
                                        disabled={isGenerating}
                                        onPress={() => {
                                            setFontScale(1.0);
                                            regenerateImage(mode, selectedSize, selectedFontId, 1.0);
                                        }}
                                    >
                                        <Text style={common.actionButtonText}>Sıfırla</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.controlButton, common.flex1]}
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
                                <Text style={[common.textStrong, common.mbSm]}>
                                    Tema Seçimi
                                </Text>
                                <View style={[common.rowGap, common.center]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            mode === 'light' && common.buttonPrimary
                                        ]}
                                        onPress={() => regenerateImage('light', selectedSize)}
                                        disabled={isGenerating}
                                    >
                                        <View>
                                            <Sun size={16} color={mode === 'light' ? '#fff' : theme.text} />
                                        </View>
                                        <Text style={[
                                            common.actionButtonText,
                                            mode === 'light' && common.buttonTextPrimary
                                        ]}>
                                            Light
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.controlButton,
                                            mode === 'dark' && common.buttonPrimary
                                        ]}
                                        onPress={() => regenerateImage('dark', selectedSize)}
                                        disabled={isGenerating}
                                    >
                                        <View>
                                            <Moon size={16} color={mode === 'dark' ? '#fff' : theme.text} />
                                        </View>
                                        <Text style={[
                                            common.actionButtonText,
                                            mode === 'dark' && common.buttonTextPrimary
                                        ]}>
                                            Dark
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Size Selection */}
                            <View style={styles.controlSection}>
                                <Text style={[common.textStrong, common.mbSm]}>
                                    Boyut Seçimi
                                </Text>
                                <ImageSizePicker selected={selectedSize} onSelect={(size) => regenerateImage(mode, size)} disabled={isGenerating} showDimensions />
                            </View>

                            {isGenerating && (
                                <View style={[styles.loadingContainer, common.row, common.center]}>
                                    <RefreshCw size={14} color={theme.textSecondary} />
                                    <Text style={styles.loadingText}>
                                        Resim oluşturuluyor...
                                    </Text>
                                </View>
                            )}

                            {/* Image Actions */}
                            <View style={styles.controlSection}>
                                <Text style={[common.textStrong, common.mbSm]}>
                                    Resim İşlemleri
                                </Text>

                                <View style={common.actionButtonRow}>
                                    <TouchableOpacity
                                        style={common.actionButton}
                                        onPress={handleDownload}
                                    >
                                        <View>
                                            <Download size={16} color={theme.text} />
                                        </View>
                                        <Text style={common.actionButtonText}>İndir</Text>
                                    </TouchableOpacity>

                                    {Platform.OS === 'web' && (
                                        <>
                                            <TouchableOpacity
                                                style={common.actionButton}
                                                onPress={handleCopy}
                                            >
                                                <View>
                                                    <Copy size={16} color={theme.text} />
                                                </View>
                                                <Text style={common.actionButtonText}>Kopyala</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={common.actionButton}
                                                onPress={handleOpenInNewTab}
                                            >
                                                <View>
                                                    <ExternalLink size={16} color={theme.text} />
                                                </View>
                                                <Text style={common.actionButtonText}>Yeni Sekmede Aç</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Video with recitation (web only) - remounted per image so it never shares a stale video */}
                            <View style={styles.controlSection}>
                                <VerseVideoActions
                                    key={currentImage}
                                    verseData={verseData}
                                    size={selectedSize}
                                    getImageUrl={async () => currentImage}
                                    disabled={isGenerating}
                                />
                            </View>

                            {/* Share Platforms */}
                            <View style={styles.controlSection}>
                                <Text style={[common.textStrong, common.mbSm]}>
                                    Paylaş
                                </Text>

                                <View style={common.gapSm}>
                                    {platforms.map((platform) => (
                                        <TouchableOpacity
                                            key={platform.id}
                                            style={styles.platformButton}
                                            onPress={() => handlePlatformShare(platform.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={common.iconBox}>
                                                <PlatformIcon spec={platform.icon} size={20} color={theme.text} />
                                            </View>
                                            <Text style={common.text}>
                                                {platform.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Verse Info */}
                            <View style={[styles.verseInfo, common.row, common.center]}>
                                <BookOpen size={14} color={theme.textSecondary} />
                                <Text style={styles.verseInfoText}>
                                    {getVerseLabel(verseData, settings.verseNumberStyle)}
                                </Text>
                            </View>

                        </ScrollView>
                    </View>
                </SafeAreaView>
            </View>

            {/* Hidden view for capturing on Native */}
            {Platform.OS !== 'web' && (
                <View style={common.offscreen}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                        <NativeVerseImageDesign
                            verseData={verseData}
                            themeMode={mode}
                            size={selectedSize}
                            arabicFontFamily={getArabicFontFamily(selectedFont)}
                            fontScale={fontScale}
                        />
                    </ViewShot>
                </View>
            )}
        </Modal>
    );
};

