import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Video, Download, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { VerseShareData, ImageSize } from '@/types';
import { getVerseFileName, getVerseLabel } from '@/utils/verseRange';
import { generateVerseVideo, isVideoGenerationSupported } from '@/utils/verseVideoGenerator';
import { createStyles } from './index.styles';

// Web globals
declare const document: any;
declare const navigator: any;
declare const File: any;

interface VerseVideoActionsProps {
    verseData: VerseShareData;
    size: ImageSize;
    /** Returns the image the video is made from (rendered on demand or already on screen). */
    getImageUrl: () => Promise<string | null>;
    disabled?: boolean;
}

/**
 * "Video with recitation" section: creates the MP4 in the browser, previews it,
 * then offers download / share. Renders nothing where video encoding isn't available.
 * Remount it (via `key`) when the source image changes so a stale video isn't shared.
 */
export const VerseVideoActions: React.FC<VerseVideoActionsProps> = ({ verseData, size, getImageUrl, disabled = false }) => {
    const { t } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { settings, availableReciters } = useSettings();
    const reciter = availableReciters.find(r => r.id === settings.selectedReciter);
    const [videoUrl, setVideoUrl] = React.useState('');
    const [progress, setProgress] = React.useState<number | null>(null);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

    if (Platform.OS !== 'web' || !isVideoGenerationSupported()) return null;

    const isBusy = progress !== null;
    const fileName = getVerseFileName(verseData, 'mp4');

    const handleCreate = async () => {
        setHasError(false);
        setProgress(0);
        try {
            const imageUrl = await getImageUrl();
            if (!imageUrl) throw new Error('Image could not be created');
            setVideoUrl(await generateVerseVideo(imageUrl, verseData, size, {
                reciterFolder: reciter?.folder,
                onProgress: setProgress,
            }));
        } catch (error) {
            console.error('Video generation error:', error);
            setHasError(true);
        }
        setProgress(null);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = fileName;
        link.click();
    };

    const handleShare = async () => {
        try {
            const blob = await (await fetch(videoUrl)).blob();
            const file = new File([blob], fileName, { type: blob.type });
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: getVerseLabel(verseData) });
            } else {
                handleDownload();
            }
        } catch (error) {
            // AbortError: the user closed the share sheet
            if ((error as any)?.name !== 'AbortError') console.error('Video share error:', error);
        }
    };

    return (
        <View>
            <Text style={[common.textStrong, common.mbSm]}>{t('share.video.title')}</Text>

            {videoUrl ? (
                <>
                    {/* Preview before downloading / sharing (plain <video>, web only) */}
                    <View style={[styles.preview, { aspectRatio: size.width / size.height }]}>
                        {React.createElement('video', {
                            src: videoUrl,
                            controls: true,
                            playsInline: true,
                            style: { width: '100%', height: '100%', objectFit: 'contain' },
                        })}
                    </View>
                    <View style={common.actionButtonRow}>
                        <TouchableOpacity style={common.actionButton} onPress={handleDownload}>
                            <Download size={16} color={theme.text} />
                            <Text style={common.actionButtonText}>{t('share.video.download')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={common.actionButton} onPress={handleShare}>
                            <Share2 size={16} color={theme.text} />
                            <Text style={common.actionButtonText}>{t('share.video.share')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={common.actionButton} onPress={() => setVideoUrl('')}>
                            <Video size={16} color={theme.text} />
                            <Text style={common.actionButtonText}>{t('share.video.recreate')}</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <TouchableOpacity
                    style={[common.actionButton, (disabled || isBusy) && common.disabled]}
                    disabled={disabled || isBusy}
                    onPress={handleCreate}
                >
                    <Video size={16} color={theme.text} />
                    <Text style={common.actionButtonText}>
                        {isBusy
                            ? t('share.video.preparing', { percent: Math.round(progress * 100) })
                            : t('share.video.create')}
                    </Text>
                </TouchableOpacity>
            )}

            <Text style={[common.smallText, common.mtSm]}>
                {hasError ? t('share.video.error') : t('share.video.hint', { reciter: reciter?.name ?? '' })}
            </Text>
        </View>
    );
};
