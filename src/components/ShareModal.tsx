import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { VerseShareData, ImageSize } from '../types';
import { ShareService } from '../utils/shareUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import { FONT_SIZES, SPACING } from '../constants';
import { IMAGE_SIZES, getDefaultImageSize } from '../utils/imageSizes';

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
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [selectedSize, setSelectedSize] = useState<ImageSize>(getDefaultImageSize());

  const handlePlatformShare = async (platformId: string) => {
    try {
      console.log('Platform seçildi:', platformId);

      if (platformId === 'image_light' || platformId === 'image_dark') {
        // Resim oluştur ve önizleme modalı aç
        const imageUrl = await ShareService.generateVerseImageForSharing(verseData, {
          themeMode: platformId === 'image_dark' ? 'dark' : 'light',
          size: selectedSize
        });
        if (imageUrl) {
          setGeneratedImageUrl(imageUrl);
          setImagePreviewVisible(true);
          return; // Modal açık kalsın
        } else {
          // Resim oluşturulamazsa fallback
          await ShareService.shareVerseWithImage(verseData, {
            themeMode: platformId === 'image_dark' ? 'dark' : 'light',
            size: selectedSize
          });
        }
      } else if (platformId === 'generic') {
        // Metin olarak genel paylaşım
        await ShareService.shareVerse(verseData);
      } else if (['twitter', 'whatsapp', 'facebook', 'telegram'].includes(platformId)) {
        // Spesifik platform - resim oluşturup o platforma gönder
        console.log(`${platformId} platformuna resimli paylaşım yapılıyor`);

        // Önce resmi oluştur
        const imageUrl = await ShareService.generateVerseImageForSharing(verseData, {
          size: selectedSize
        });
        if (imageUrl) {
          const url = ShareService.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);
          ShareService.shareToSocialPlatform(platformId, imageUrl, url);
        } else {
          // Resim oluşturulamazsa metin paylaşımı yap
          await ShareService.shareToSpecificPlatform(
            verseData,
            platformId as 'twitter' | 'whatsapp' | 'facebook' | 'telegram'
          );
        }
      } else {
        await ShareService.shareToSpecificPlatform(
          verseData,
          platformId as 'twitter' | 'whatsapp' | 'facebook' | 'telegram'
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
          <View style={[styles.modal, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.text }]}>
                Ayeti Paylaş
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verse Preview */}
            <View style={[styles.versePreview, { backgroundColor: theme.surface }]}>
              <Text style={[styles.arabicText, { color: theme.text }]}>
                {verseData.arabicText}
              </Text>
              <Text style={[styles.translationText, { color: theme.textSecondary }]}>
                "{verseData.translation}"
              </Text>
              <Text style={[styles.verseInfo, { color: theme.primary }]}>
                📖 {verseData.surahName} Suresi, {verseData.verseNumber}. Ayet
              </Text>
            </View>

            {/* Size Selection */}
            <View style={styles.sizeSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                📐 Resim Boyutu Seçin
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
                      onPress={() => setSelectedSize(size)}
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
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Platform Options */}
            <ScrollView style={styles.platformList} showsVerticalScrollIndicator={false}>
              {platforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={[styles.platformItem, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handlePlatformShare(platform.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.platformIcon}>{platform.icon}</Text>
                  <Text style={[styles.platformName, { color: theme.text }]}>
                    {platform.name}
                  </Text>
                  <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
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
  versePreview: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
  },
  arabicText: {
    fontSize: FONT_SIZES.large,
    textAlign: 'right',
    lineHeight: FONT_SIZES.large * 1.25,
    marginBottom: SPACING.sm,
    // Aynı font ailesi Verse bileşeni ile hizalı olsun
    fontFamily: Platform.select({
      web: '"Scheherazade New", "Noto Naskh Arabic", Amiri, "Traditional Arabic", "Arabic Typesetting", serif',
      ios: 'Al Nile',
      default: 'serif'
    }) as any,
  },
  translationText: {
    fontSize: FONT_SIZES.medium,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.medium * 1.3,
  },
  verseInfo: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  sizeSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
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
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  sizeIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  sizeTitle: {
    fontSize: FONT_SIZES.small - 1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sizeDescription: {
    fontSize: FONT_SIZES.small - 2,
    textAlign: 'center',
    lineHeight: 14,
  },
  platformList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
  },
  platformIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  platformName: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
});
