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

// Web globals
declare const window: any;
declare const navigator: any;
declare const ClipboardItem: any;
import { useTheme, Theme } from '../contexts/ThemeContext';
import { VerseShareData } from '../types';
import { ShareService } from '../utils/shareUtils';
import { FONT_SIZES, SPACING } from '../constants';

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
    const { theme } = useTheme();
    const [currentImage, setCurrentImage] = React.useState(imageUrl);
    const [mode, setMode] = React.useState<'light' | 'dark'>('light');
    React.useEffect(() => { setCurrentImage(imageUrl); }, [imageUrl]);

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
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                                    onPress={async () => {
                                        if (mode !== 'light') setMode('light');
                                        const img = await ShareService.generateVerseImageForSharing(verseData, 'light');
                                        if (img) setCurrentImage(img);
                                    }}
                                >
                                    <Text style={styles.actionIcon}>🔆</Text>
                                    <Text style={[styles.actionText, { color: theme.text }]}>Light</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                                    onPress={async () => {
                                        if (mode !== 'dark') setMode('dark');
                                        const img = await ShareService.generateVerseImageForSharing(verseData, 'dark');
                                        if (img) setCurrentImage(img);
                                    }}
                                >
                                    <Text style={styles.actionIcon}>🌙</Text>
                                    <Text style={[styles.actionText, { color: theme.text }]}>Dark</Text>
                                </TouchableOpacity>
                            </View>

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
    actionsContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        marginBottom: SPACING.md,
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
