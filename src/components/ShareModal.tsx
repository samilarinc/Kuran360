import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { NativeVerseImageDesign } from './NativeVerseImageDesign';
import { VerseShareData, ImageSize } from '../types';
import { ShareService } from '../utils/shareUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import { IMAGE_SIZES, getDefaultImageSize } from '../utils/imageSizes';
import { useSettings } from '../contexts/SettingsContext';
import { getFontOption } from '../constants/fonts';
import { ArabicText } from './ArabicText';
import { createStyles } from './ShareModal.styles';

interface ShareModalProps {
  isVisible: boolean;
  onClose: () => void;
  verseData: VerseShareData;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isVisible,
  onClose,
  verseData,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { settings } = useSettings();
  const imageFontCss = getFontOption(settings.imageArabicFont).css;
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [selectedSize, setSelectedSize] = useState<ImageSize>(getDefaultImageSize());
  const viewShotRef = React.useRef<any>(null);
  const [captureOptions, setCaptureOptions] = useState({ themeMode: 'light' as 'light' | 'dark', size: selectedSize });

  const handlePlatformShare = async (platformId: string) => {
    try {
      console.log('Platform seçildi:', platformId);

      if (platformId === 'image_light' || platformId === 'image_dark') {
        const themeMode = platformId === 'image_dark' ? 'dark' : 'light';
        // Resim oluştur ve önizleme modalı aç
        if (Platform.OS === 'web') {
          const imageUrl = await ShareService.generateVerseImageForSharing(verseData, {
            themeMode,
            size: selectedSize,
            arabicFontCss: imageFontCss,
          });
          if (imageUrl) {
            setGeneratedImageUrl(imageUrl);
            setImagePreviewVisible(true);
            return;
          }
        } else {
          // Native version
          setCaptureOptions({ themeMode, size: selectedSize });
          setTimeout(async () => {
            try {
              if (!viewShotRef.current) {
                throw new Error('ViewShot ref is not attached');
              }
              const uri = await captureRef(viewShotRef.current, { format: 'png', quality: 0.9 });
              setGeneratedImageUrl(uri);
              setImagePreviewVisible(true);
            } catch (err) {
              console.error('Capture error:', err);
              Alert.alert('Hata', 'Resim oluşturulamadı.');
            }
          }, 150);
          return;
        }
      } else if (platformId === 'generic') {
        // Metin olarak genel paylaşım
        await ShareService.shareVerse(verseData);
      } else if (['twitter', 'whatsapp', 'facebook', 'telegram'].includes(platformId)) {
        // Spesifik platform - resim oluşturup o platforma gönder
        if (Platform.OS === 'web') {
          const imageUrl = await ShareService.generateVerseImageForSharing(verseData, {
            size: selectedSize,
            arabicFontCss: imageFontCss,
          });
          if (imageUrl) {
            const url = ShareService.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);
            ShareService.shareToSocialPlatform(platformId, imageUrl, url);
          } else {
            await ShareService.shareToSpecificPlatform(verseData, platformId as any);
          }
        } else {
          // Native version for specific platform
          setCaptureOptions({ themeMode: 'light', size: selectedSize });
          setTimeout(async () => {
            try {
              if (!viewShotRef.current) {
                throw new Error('ViewShot ref is not attached');
              }
              const uri = await captureRef(viewShotRef.current, { format: 'png', quality: 0.9 });
              const url = ShareService.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);
              ShareService.shareToSocialPlatform(platformId, uri, url);
            } catch (err) {
              await ShareService.shareToSpecificPlatform(verseData, platformId as any);
            }
          }, 150);
        }
      } else {
        await ShareService.shareToSpecificPlatform(
          verseData,
          platformId as any
        );
      }
      onClose();
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  }; const platforms = ShareService.getAvailablePlatforms();

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Ayeti Paylaş
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

              {/* Verse Preview */}
              <View style={styles.versePreview}>
                <ArabicText style={styles.arabicText}>
                  {verseData.arabicText}
                </ArabicText>
                <Text style={styles.translationText}>
                  "{verseData.translation}"
                </Text>
                <Text style={styles.verseInfo}>
                  📖 {verseData.surahName} Suresi, {verseData.verseNumber}. Ayet
                </Text>
              </View>

              {/* Size Selection */}
              <View style={styles.sizeSection}>
                <Text style={styles.sectionTitle}>
                  📐 Resim Boyutu Seçin
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView} nestedScrollEnabled={true}>
                  <View style={styles.sizeRow}>
                    {IMAGE_SIZES.map((size) => (
                      <TouchableOpacity
                        key={size.id}
                        style={[
                          styles.sizeButton,
                          selectedSize.id === size.id && styles.sizeButtonSelected
                        ]}
                        onPress={() => setSelectedSize(size)}
                      >
                        <Text style={styles.sizeIcon}>{size.icon}</Text>
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
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Platform Options */}
              {platforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={styles.platformItem}
                  onPress={() => handlePlatformShare(platform.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.platformIcon}>{platform.icon}</Text>
                  <Text style={styles.platformName}>
                    {platform.name}
                  </Text>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}

            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isVisible={imagePreviewVisible}
        onClose={() => {
          setImagePreviewVisible(false);
          setGeneratedImageUrl('');
        }}
        imageUrl={generatedImageUrl}
        verseData={verseData}
      />

      {/* Hidden view for capturing on Native */}
      {Platform.OS !== 'web' && (
        <View style={styles.hiddenCapture}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <NativeVerseImageDesign
              verseData={verseData}
              themeMode={captureOptions.themeMode}
              size={captureOptions.size}
            />
          </ViewShot>
        </View>
      )}
    </Modal>
  );
};

