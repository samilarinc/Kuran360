import { Square, Monitor, Image as ImageIcon } from 'lucide-react-native';
import { ImageSize } from '@/types';
import i18n from '@/i18n';

/** Name and description are read through i18n each time, so they follow the current language. */
const withLabels = (size: Omit<ImageSize, 'displayName' | 'description'>): ImageSize => ({
    ...size,
    get displayName() { return i18n.t(`imageSizes.${size.id}.name`); },
    get description() { return i18n.t(`imageSizes.${size.id}.description`); },
});

export const IMAGE_SIZES: ImageSize[] = [
    withLabels({
        id: 'square_1080',
        name: 'square_1080',
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
        icon: { kind: 'lucide', Icon: Square }
    }),
    withLabels({
        id: 'instagram_story',
        name: 'instagram_story',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        icon: { kind: 'brand', name: 'instagram' }
    }),
    withLabels({
        id: 'twitter_post',
        name: 'twitter_post',
        width: 1200,
        height: 675,
        aspectRatio: '16:9',
        icon: { kind: 'brand', name: 'x-twitter' }
    }),
    withLabels({
        id: 'twitter_banner',
        name: 'twitter_banner',
        width: 1500,
        height: 500,
        aspectRatio: '3:1',
        icon: { kind: 'brand', name: 'x-twitter' }
    }),
    withLabels({
        id: 'facebook_cover',
        name: 'facebook_cover',
        width: 1200,
        height: 630,
        aspectRatio: '1.91:1',
        icon: { kind: 'brand', name: 'facebook' }
    }),
    withLabels({
        id: 'wide_hd',
        name: 'wide_hd',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        icon: { kind: 'lucide', Icon: Monitor }
    }),
    withLabels({
        id: 'standard_hd',
        name: 'standard_hd',
        width: 1280,
        height: 720,
        aspectRatio: '16:9',
        icon: { kind: 'brand', name: 'youtube' }
    }),
    withLabels({
        id: 'classic',
        name: 'classic',
        width: 800,
        height: 600,
        aspectRatio: '4:3',
        icon: { kind: 'lucide', Icon: ImageIcon }
    }),
    withLabels({
        id: 'pinterest',
        name: 'pinterest',
        width: 735,
        height: 1102,
        aspectRatio: '2:3',
        icon: { kind: 'brand', name: 'pinterest' }
    })
];

export const getImageSizeById = (id: string): ImageSize => {
    return IMAGE_SIZES.find(size => size.id === id) || IMAGE_SIZES[6]; // Default to classic
};

export const getDefaultImageSize = (): ImageSize => {
    return IMAGE_SIZES[6]; // Classic 800x600
};