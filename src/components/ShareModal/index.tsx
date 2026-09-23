import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, Platform, Alert, StyleSheet } from 'react-native';
import { BookOpen, Ruler, ListOrdered, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { NativeVerseImageDesign } from '../NativeVerseImageDesign';
import { VerseShareData, ImageSize } from '@/types';
import { ShareService } from '@/utils/shareUtils';
import { ImagePreviewModal } from '../ImagePreviewModal';
import { PlatformIcon } from '../PlatformIcon';
import { ImageSizePicker } from '../ImageSizePicker';
import { VerseVideoActions } from '../VerseVideoActions';
import { getDefaultImageSize } from '@/utils/imageSizes';
import { useSettings } from '@/contexts/SettingsContext';
import { formatVerseNumber } from '@/utils/numerals';
import { MAX_SHARE_VERSES, buildVerseRangeShareData, getMaxRangeEnd, getVerseLabel } from '@/utils/verseRange';
import { getFontOption, getArabicFontFamily } from '@/constants/fonts';
import { ArabicText } from '../ArabicText';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface ShareModalProps {
  isVisible: boolean;
  onClose: () => void;
  verseData: VerseShareData;
  /** Translation used for the extra verses of a range; defaults to the favorite translation. */
  translationKey?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isVisible,
  onClose,
  verseData: baseVerseData,
  translationKey,
}) => {
  const { t } = useTranslation();
  const { theme, common, isDarkMode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { settings } = useSettings();
  const imageFontCss = getArabicFontFamily(getFontOption(settings.imageArabicFont));
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [selectedSize, setSelectedSize] = useState<ImageSize>(getDefaultImageSize());
  const viewShotRef = React.useRef<any>(null);
  const [captureOptions, setCaptureOptions] = useState({ themeMode: 'light' as 'light' | 'dark', size: selectedSize });

  // Verse range: the tapped verse is the start, the user picks the last verse
  const startVerse = baseVerseData.verseNumber;
  const maxEnd = getMaxRangeEnd(baseVerseData.surahNumber, startVerse);
  const [endVerse, setEndVerse] = useState(startVerse);
  const [verseData, setVerseData] = useState<VerseShareData>(baseVerseData);
  const [isLoadingRange, setIsLoadingRange] = useState(false);

  useEffect(() => {
    if (isVisible) setEndVerse(startVerse);
  }, [isVisible, startVerse]);

  useEffect(() => {
    if (endVerse <= startVerse) {
      setVerseData(baseVerseData);
      return;
    }
    let cancelled = false;
    setIsLoadingRange(true);
    buildVerseRangeShareData(baseVerseData, endVerse, translationKey ?? settings.favoriteTranslation)
      .then(data => { if (!cancelled) setVerseData(data); })
      .catch(err => console.error('Verse range error:', err))
      .finally(() => { if (!cancelled) setIsLoadingRange(false); });
    return () => { cancelled = true; };
  }, [baseVerseData, endVerse, startVerse, translationKey, settings.favoriteTranslation]);

  const handlePlatformShare = async (platformId: string) => {
    if (isLoadingRange) return;
    try {
      console.log('Platform seçildi:', platformId);

      if (platformId === 'image_light' || platformId === 'image_dark') {
        const themeMode = platformId === 'image_dark' ? 'dark' : 'light';
        // Resim oluştur ve önizleme modalı aç
        setCaptureOptions({ themeMode, size: selectedSize });
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
      <View style={common.modalOverlayBottom}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={common.modalHeader}>
              <Text style={common.modalHeaderTitle}>
                Ayeti Paylaş
              </Text>
              <TouchableOpacity onPress={onClose} style={common.modalCloseButton}>
                <Text style={common.modalCloseButtonText}>
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
                <View style={[common.row, common.center, common.gapXs]}>
                  <BookOpen size={14} color={theme.primary} />
                  <Text style={styles.verseInfo}>
                    {isLoadingRange ? t('share.loadingVerses') : getVerseLabel(verseData, settings.verseNumberStyle)}
                  </Text>
                </View>
              </View>

              {/* Verse Range Selection */}
              {maxEnd > startVerse && (
                <View style={common.mbMd}>
                  <View style={[common.row, common.gapXs, common.mbSm]}>
                    <ListOrdered size={16} color={theme.text} />
                    <Text style={common.textStrong}>{t('share.verseRange')}</Text>
                  </View>
                  <View style={[common.rowGap, common.center]}>
                    <TouchableOpacity
                      style={[common.button, common.buttonOutline, endVerse <= startVerse && common.disabled]}
                      disabled={endVerse <= startVerse}
                      onPress={() => setEndVerse(v => Math.max(startVerse, v - 1))}
                    >
                      <Minus size={16} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={[common.textStrong, common.textCenter, common.flex1]}>
                      {formatVerseNumber(startVerse, settings.verseNumberStyle)}
                      {endVerse > startVerse ? ` - ${formatVerseNumber(endVerse, settings.verseNumberStyle)}` : ''}
                    </Text>
                    <TouchableOpacity
                      style={[common.button, common.buttonOutline, endVerse >= maxEnd && common.disabled]}
                      disabled={endVerse >= maxEnd}
                      onPress={() => setEndVerse(v => Math.min(maxEnd, v + 1))}
                    >
                      <Plus size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[common.smallText, common.textCenter, common.mtSm]}>
                    {t('share.verseRangeHint', { max: MAX_SHARE_VERSES })}
                  </Text>
                </View>
              )}

              {/* Size Selection */}
              <View style={common.mbMd}>
                <View style={[common.row, common.gapXs, common.mbSm]}>
                  <Ruler size={16} color={theme.text} />
                  <Text style={common.textStrong}>
                    Resim Boyutu Seçin
                  </Text>
                </View>
                <ImageSizePicker selected={selectedSize} onSelect={setSelectedSize} />
              </View>

              {/* Video with recitation (web only), rendered in the app's current theme */}
              <View style={common.mbMd}>
                <VerseVideoActions
                  key={`${verseData.verseNumber}-${verseData.verseNumberEnd ?? ''}-${selectedSize.id}`}
                  verseData={verseData}
                  size={selectedSize}
                  disabled={isLoadingRange}
                  getImageUrl={() => ShareService.generateVerseImageForSharing(verseData, {
                    themeMode: isDarkMode ? 'dark' : 'light',
                    size: selectedSize,
                    arabicFontCss: imageFontCss,
                  })}
                />
              </View>

              {/* Platform Options */}
              {platforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={styles.platformItem}
                  onPress={() => handlePlatformShare(platform.id)}
                  activeOpacity={0.7}
                >
                  <View style={common.iconBox}>
                    <PlatformIcon spec={platform.icon} size={22} color={theme.text} />
                  </View>
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
        initialThemeMode={captureOptions.themeMode}
        initialSize={captureOptions.size}
      />

      {/* Hidden view for capturing on Native */}
      {Platform.OS !== 'web' && (
        <View style={common.offscreen}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <NativeVerseImageDesign
              verseData={verseData}
              themeMode={captureOptions.themeMode}
              size={captureOptions.size}
              arabicFontFamily={imageFontCss}
            />
          </ViewShot>
        </View>
      )}
    </Modal>
  );
};

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
    backgroundColor: theme.background,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  versePreview: {
    marginVertical: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: theme.surface,
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
    color: theme.text,
  },
  translationText: {
    fontSize: FONT_SIZES.medium,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.medium * 1.3,
    color: theme.textSecondary,
  },
  verseInfo: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.primary,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
  },
  platformName: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    color: theme.text,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
    color: theme.textSecondary,
  },
  });
};
