import { ImageSize } from '../types';

export const IMAGE_SIZES: ImageSize[] = [
    {
        id: 'square_1080',
        name: 'square_1080',
        displayName: 'Kare (1080x1080)',
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
        description: 'Instagram Post, Facebook Post',
        icon: '⬜'
    },
    {
        id: 'instagram_story',
        name: 'instagram_story',
        displayName: 'Story (1080x1920)',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        description: 'Instagram Story, WhatsApp Status',
        icon: '📱'
    },
    {
        id: 'twitter_post',
        name: 'twitter_post',
        displayName: 'Twitter (1200x675)',
        width: 1200,
        height: 675,
        aspectRatio: '16:9',
        description: 'Twitter/X Post, LinkedIn',
        icon: '🐦'
    },
    {
        id: 'twitter_banner',
        name: 'twitter_banner',
        displayName: 'Twitter Banner (1500x500)',
        width: 1500,
        height: 500,
        aspectRatio: '3:1',
        description: 'Twitter/X Kapak, Geniş Banner',
        icon: '🔄'
    },
    {
        id: 'facebook_cover',
        name: 'facebook_cover',
        displayName: 'Facebook Kapak (1200x630)',
        width: 1200,
        height: 630,
        aspectRatio: '1.91:1',
        description: 'Facebook Cover, Paylaşım',
        icon: '📘'
    },
    {
        id: 'wide_hd',
        name: 'wide_hd',
        displayName: 'Geniş HD (1920x1080)',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        description: 'Masaüstü Duvar Kağıdı, Sunum',
        icon: '🖥️'
    },
    {
        id: 'standard_hd',
        name: 'standard_hd',
        displayName: 'Standart HD (1280x720)',
        width: 1280,
        height: 720,
        aspectRatio: '16:9',
        description: 'YouTube Thumbnail, Genel Kullanım',
        icon: '📺'
    },
    {
        id: 'classic',
        name: 'classic',
        displayName: 'Klasik (800x600)',
        width: 800,
        height: 600,
        aspectRatio: '4:3',
        description: 'Geleneksel Format, E-posta',
        icon: '🖼️'
    },
    {
        id: 'pinterest',
        name: 'pinterest',
        displayName: 'Pinterest (735x1102)',
        width: 735,
        height: 1102,
        aspectRatio: '2:3',
        description: 'Pinterest Pin, Dikey Paylaşım',
        icon: '📌'
    }
];

export const getImageSizeById = (id: string): ImageSize => {
    return IMAGE_SIZES.find(size => size.id === id) || IMAGE_SIZES[6]; // Default to classic
};

export const getDefaultImageSize = (): ImageSize => {
    return IMAGE_SIZES[6]; // Classic 800x600
};