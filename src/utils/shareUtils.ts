import { Platform, Alert, Share as RNShare } from 'react-native';
// Expo FileSystem yerel dosya oluşturmak için
let FileSystem: any = null;
try {
    FileSystem = require('expo-file-system');
} catch (e: any) {
    // Web veya modül yoksa sorun değil, sadece resim dosyası üretilemez
    console.log('expo-file-system bulunamadı (web olabilir):', (e && e.message) ? e.message : String(e));
}
import { VerseShareData, ShareOptions } from '../types';
import { VerseImageGenerator } from './verseImageGenerator';

// Web globals
declare const window: any;
declare const navigator: any;
declare const document: any;

// Conditional import for native platforms only
let Share: any = null;
let Social: any = null;

if (Platform.OS !== 'web') {
    try {
        const RNShareModule = require('react-native-share');
        Share = RNShareModule.default || RNShareModule;
        Social = RNShareModule.Social;
    } catch (error) {
        console.log('React Native Share not available:', error);
    }
}

export class ShareService {
    private static readonly APP_URL = 'https://kuran360.com';
    private static readonly APP_NAME = 'Kuran 360';

    /**
     * Ayet URL'ini oluşturur
     */
    static generateVerseUrl(surahNumber: number, verseNumber: number): string {
        return `${this.APP_URL}/surah/${surahNumber}/verse/${verseNumber}`;
    }

    /**
     * Web ortamında (SPA) dinamik meta etiketlerini günceller (Twitter / OG). Bu sadece paylaşılan linki açan kullanıcı için çalışır; 
     * Twitter botu client-side JS çalıştırmadığı için gerçek kart önizlemesi sunucu-side destek olmadan oluşmaz.
     */
    static updateWebMetaForVerse(verse: VerseShareData) {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;
        try {
            const verseUrl = this.generateVerseUrl(verse.surahNumber, verse.verseNumber);
            const title = `${verse.surahName} ${verse.verseNumber}. Ayet | Kuran360`;
            const description = `${verse.translation}`.slice(0, 180);
            const image = 'https://kuran360.com/social/default-card.png'; // Dinamik üretim için sunucu gerekir

            const setTag = (attr: string, name: string, content: string) => {
                let el = document.querySelector(`${attr}[name='${name}']`) || document.querySelector(`${attr}[property='${name}']`);
                if (!el) {
                    el = document.createElement('meta');
                    if (attr === 'meta') {
                        if (name.startsWith('og:')) el.setAttribute('property', name); else el.setAttribute('name', name);
                    }
                    document.head.appendChild(el);
                }
                el.setAttribute('content', content);
            };

            setTag('meta', 'twitter:card', 'summary_large_image');
            setTag('meta', 'twitter:site', '@kuran360');
            setTag('meta', 'twitter:title', title);
            setTag('meta', 'twitter:description', description);
            setTag('meta', 'twitter:image', image);
            setTag('meta', 'twitter:url', verseUrl);

            setTag('meta', 'og:type', 'article');
            setTag('meta', 'og:site_name', 'Kuran360');
            setTag('meta', 'og:title', title);
            setTag('meta', 'og:description', description);
            setTag('meta', 'og:image', image);
            setTag('meta', 'og:url', verseUrl);

            // Document title güncelle
            document.title = title;
        } catch (e) {
            console.log('Meta update hata:', e);
        }
    }

    /**
     * Ana ayetin paylaşım metnini oluşturur
     */
    static generateShareText(verseData: VerseShareData): string {
        const { arabicText, translation, surahName, verseNumber, surahNumber } = verseData;

        return `${arabicText}

"${translation}"

📖 ${surahName} Suresi, ${verseNumber}. Ayet

🔗 Bu güzel ayete göz atın: ${this.generateVerseUrl(surahNumber, verseNumber)}

${this.APP_NAME}`;
    }

    /**
     * Tüm platformlar için aynı paylaşım metni oluşturur
     */
    static generatePlatformSpecificText(verseData: VerseShareData, platform: ShareOptions['platform']): string {
        const { arabicText, translation, surahName, verseNumber } = verseData;

        // Tüm platformlar için aynı format
        return `${arabicText}

"${translation}"

📖 ${surahName} Suresi, ${verseNumber}. Ayet

${this.generateVerseUrl(verseData.surahNumber, verseNumber)}`;
    }

    /**
     * Sadece resim oluşturur, paylaşmaz (platform-specific paylaşım için)
     */
    static async generateVerseImageForSharing(verseData: VerseShareData): Promise<string | null> {
        try {
            console.log('Resim oluşturuluyor:', verseData);
            const imageUrl = await VerseImageGenerator.generateVerseImage(verseData);
            if (!imageUrl) {
                console.error('Resim oluşturulamadı');
                return null;
            }
            console.log('Resim başarıyla oluşturuldu:', imageUrl);
            return imageUrl;
        } catch (error) {
            console.error('Resim oluşturma hatası:', error);
            return null;
        }
    }

    /**
     * Ayet resmini oluşturup paylaşır - Sadece resim ve link
     */
    static async shareVerseWithImage(verseData: VerseShareData, options?: ShareOptions): Promise<void> {
        try {
            // Resmi oluştur
            const imageUrl = await VerseImageGenerator.generateVerseImage(verseData);

            if (!imageUrl) {
                Alert.alert('Hata', 'Resim oluşturulamadı. Lütfen tekrar deneyin.');
                return;
            }

            // Sadece link - başka metin yok
            const verseUrl = this.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);

            if (Platform.OS === 'web') {
                await this.shareImageOnWeb(imageUrl, verseUrl, '', verseUrl, verseData);
            } else if (Share) {
                const localFile = await this.ensureLocalFile(imageUrl, 'verse_share.png');
                const shareOptions = {
                    url: localFile,
                    message: verseUrl,
                    type: 'image/png',
                };
                await Share.open(shareOptions);
            } else {
                Alert.alert('Hata', 'Paylaşım desteklenmiyor.');
            }
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Resimli paylaşım hatası:', error);
                Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu.');
            }
        }
    }

    /**
     * Base64 data URL ise yerel dosyaya çevirir; değilse olduğu gibi döner
     */
    private static async ensureLocalFile(imageUrl: string, filename: string): Promise<string> {
        try {
            if (Platform.OS === 'web') return imageUrl; // Web'de dosya yolu gerekmiyor
            if (!FileSystem) return imageUrl;
            if (!imageUrl.startsWith('data:image')) return imageUrl; // Zaten dosya ya da uzak URL

            const base64Part = imageUrl.split(',')[1];
            if (!base64Part) return imageUrl;

            const fileUri = FileSystem.cacheDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, base64Part, { encoding: FileSystem.EncodingType.Base64 });
            return fileUri;
        } catch (error) {
            console.log('ensureLocalFile hata:', error);
            return imageUrl;
        }
    }

    /**
     * Web'de resim ve link paylaşımı - Sadece resim ve link
     */
    static async shareImageOnWeb(imageUrl: string, message: string, title: string, url: string, verseData?: VerseShareData): Promise<void> {
        try {
            // Web Share API ile resim ve link paylaşımı
            if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], 'verse.png', { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        url: url // Sadece link, başka metin yok
                    });
                    return;
                }
            }

            // Web Share API desteklenmiyorsa platform seçimi sun
            this.showPlatformOptions(imageUrl, url, verseData);

        } catch (error) {
            console.error('Web resim paylaşım hatası:', error);
            this.showPlatformOptions(imageUrl, url, verseData);
        }
    }

    /**
     * Platform seçeneklerini göster
     */
    static showPlatformOptions(imageUrl: string, url: string, verseData?: VerseShareData): void {
        Alert.alert(
            'Paylaşım Platformu Seçin',
            'Resmi hangi platformda paylaşmak istiyorsunuz?',
            [
                {
                    text: 'Twitter',
                    onPress: () => this.shareToSocialPlatform('twitter', imageUrl, url)
                },
                {
                    text: 'Facebook',
                    onPress: () => this.shareToSocialPlatform('facebook', imageUrl, url)
                },
                {
                    text: 'WhatsApp',
                    onPress: () => this.shareToSocialPlatform('whatsapp', imageUrl, url)
                },
                {
                    text: 'Instagram',
                    onPress: () => this.shareToSocialPlatform('instagram', imageUrl, url)
                },
                {
                    text: 'İndir',
                    onPress: () => this.downloadImageAsBlob(imageUrl, verseData)
                },
                {
                    text: 'İptal',
                    style: 'cancel'
                }
            ]
        );
    }

    /**
     * Belirli sosyal medya platformuna paylaş
     */
    static shareToSocialPlatform(platform: string, imageUrl: string, url: string): void {
        console.log(`${platform} platformu için paylaşım başlatılıyor:`, { imageUrl, url });

        try {
            switch (platform) {
                case 'twitter':
                    this.shareToTwitterWithImage(imageUrl, url);
                    break;
                case 'facebook':
                    this.shareToFacebookWithImage(imageUrl, url);
                    break;
                case 'whatsapp':
                    this.shareToWhatsAppWithImage(imageUrl, url);
                    break;
                case 'instagram':
                    // Instagram web'de direct link paylaşımı desteklemiyor
                    Alert.alert(
                        'Instagram',
                        'Instagram için resmi indirip manuel olarak paylaşmanız gerekiyor.',
                        [
                            { text: 'İndir', onPress: () => this.downloadImageAsBlob(imageUrl) },
                            { text: 'İptal', style: 'cancel' }
                        ]
                    );
                    return;
                default:
                    console.log('Bilinmeyen platform:', platform);
                    return;
            }
        } catch (error) {
            console.error(`${platform} paylaşım hatası:`, error);
            Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu.');
        }
    }

    /**
     * Twitter'a resim ile birlikte paylaş
     */
    static async shareToTwitterWithImage(imageUrl: string, url: string): Promise<void> {
        try {
            console.log('Twitter paylaşımı başlatılıyor:', { imageUrl, url });

            if (Platform.OS === 'web') {
                // Web'de Twitter'a resim paylaşımı için özel yaklaşım
                if (typeof navigator !== 'undefined' && navigator.share) {
                    // Web Share API ile resim paylaşımı dene
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'verse.png', { type: 'image/png' });

                    await navigator.share({
                        files: [file],
                        title: 'Ayet Paylaşımı',
                        text: `Ayet paylaşımı - ${url}`
                    });
                } else {
                    // Fallback: Twitter intent URL'i
                    const text = encodeURIComponent(`Ayet paylaşımı: ${url}`);
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
                    this.openUrlInNewTab(twitterUrl);
                }
            } else {
                // Native platformlar için: data URL ise dosyaya çevir
                const localFile = await this.ensureLocalFile(imageUrl, `twitter_verse_${Date.now()}.png`);
                if (Share && Social) {
                    await Share.shareSingle({
                        social: Social.Twitter,
                        message: `Ayet paylaşımı: ${url}`,
                        url: localFile,
                    });
                } else {
                    await RNShare.share({
                        message: `Ayet paylaşımı: ${url}`,
                        url: localFile,
                    });
                }
            }
        } catch (error) {
            console.error('Twitter paylaşım hatası:', error);
            Alert.alert('Hata', 'Twitter paylaşımı başarısız oldu.');
        }
    }

    /**
     * Facebook'a resim ile birlikte paylaş
     */
    static async shareToFacebookWithImage(imageUrl: string, url: string): Promise<void> {
        try {
            console.log('Facebook paylaşımı başlatılıyor:', { imageUrl, url });

            if (Platform.OS === 'web') {
                const encodedUrl = encodeURIComponent(url);
                const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                this.openUrlInNewTab(facebookUrl);
            } else {
                const localFile = await this.ensureLocalFile(imageUrl, `facebook_verse_${Date.now()}.png`);
                if (Share && Social) {
                    await Share.shareSingle({
                        social: Social.Facebook,
                        message: `Ayet paylaşımı: ${url}`,
                        url: localFile,
                    });
                } else {
                    await RNShare.share({
                        message: `Ayet paylaşımı: ${url}`,
                        url: localFile,
                    });
                }
            }
        } catch (error) {
            console.error('Facebook paylaşım hatası:', error);
            Alert.alert('Hata', 'Facebook paylaşımı başarısız oldu.');
        }
    }

    /**
     * WhatsApp'a resim ile birlikte paylaş
     */
    static async shareToWhatsAppWithImage(imageUrl: string, url: string): Promise<void> {
        try {
            console.log('WhatsApp paylaşımı başlatılıyor:', { imageUrl, url });

            if (Platform.OS === 'web') {
                const message = encodeURIComponent(`Ayet paylaşımı: ${url}`);
                const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;
                this.openUrlInNewTab(whatsappUrl);
            } else {
                const localFile = await this.ensureLocalFile(imageUrl, `whatsapp_verse_${Date.now()}.png`);
                if (Share && Social) {
                    await Share.shareSingle({
                        social: Social.Whatsapp,
                        message: `Ayet paylaşımı: ${url}`,
                        url: localFile,
                    });
                } else {
                    await RNShare.share({
                        message: `Ayet paylaşımı: ${url}`,
                        url: localFile,
                    });
                }
            }
        } catch (error) {
            console.error('WhatsApp paylaşım hatası:', error);
            Alert.alert('Hata', 'WhatsApp paylaşımı başarısız oldu.');
        }
    }

    /**
     * Web'de resmi indir
     */
    static downloadImageAsBlob(imageUrl: string, verseData?: VerseShareData): void {
        try {
            const link = document.createElement('a');
            const filename = verseData
                ? `${verseData.surahName.replace(/[^a-zA-Z0-9]/g, '_')}_Verse_${verseData.verseNumber}.png`
                : `verse_${Date.now()}.png`;

            link.href = imageUrl;
            link.download = filename;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                URL.revokeObjectURL(imageUrl);
            }, 1000);

            Alert.alert('Başarılı', `Resim "${filename}" olarak indirildi.`);

        } catch (error) {
            console.error('Resim indirme hatası:', error);
            Alert.alert('Hata', 'Resim indirilemedi.');
        }
    }

    /**
     * Genel paylaşım fonksiyonu
     */
    static async shareVerse(verseData: VerseShareData, options?: ShareOptions): Promise<void> {
        try {
            const title = options?.title || `${verseData.surahName} ${verseData.verseNumber}. Ayet`;
            const message = options?.message || this.generateShareText(verseData);
            const url = options?.url || this.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);

            if (Platform.OS === 'web') {
                // Web için Web Share API kullan, yoksa fallback
                await this.shareOnWeb(message, title, url);
            } else if (Share) {
                // Native platformlar için react-native-share
                const shareOptions = {
                    title,
                    message: Platform.OS === 'ios' ? message : `${message}\n\n${url}`,
                    url: Platform.OS === 'ios' ? url : undefined,
                };
                const result = await Share.open(shareOptions);
                console.log('Paylaşım başarılı:', result);
            } else {
                // React Native'in built-in Share API'si
                await RNShare.share({
                    message: `${message}\n\n${url}`,
                    title,
                });
            }
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Paylaşım hatası:', error);
                Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu.');
            }
        }
    }

    /**
     * Web için paylaşım fonksiyonu
     */
    static async shareOnWeb(message: string, title: string, url: string): Promise<void> {
        try {
            // Web Share API dene
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title,
                    text: message,
                    url,
                });
                return;
            }

            // Clipboard fallback
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(`${message}\n\n${url}`);
                Alert.alert('Kopyalandı', 'Ayet metni panoya kopyalandı.');
                return;
            }

            // En son fallback
            Alert.alert('Paylaşım Metni', `${message}\n\n${url}`);
        } catch (error) {
            console.log('Web paylaşım hatası:', error);
            Alert.alert('Paylaşım Metni', `${message}\n\n${url}`);
        }
    }

    /**
     * Web'de belirli platforma yönlendirme
     */
    static shareOnWebPlatform(platform: string, message: string, url: string): void {
        const encodedMessage = encodeURIComponent(message);
        const encodedUrl = encodeURIComponent(url);

        let shareUrl: string;

        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodedMessage}%0A%0A${encodedUrl}`;
                console.log('WhatsApp Paylaşım URL\'si:', shareUrl);
                this.openUrlInNewTab(shareUrl);
                break;

            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
                console.log('Twitter Paylaşım URL\'si:', shareUrl);
                this.openUrlInNewTab(shareUrl);
                break;

            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
                console.log('Facebook Paylaşım URL\'si:', shareUrl);
                this.openUrlInNewTab(shareUrl);
                break;

            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
                console.log('Telegram Paylaşım URL\'si:', shareUrl);
                this.openUrlInNewTab(shareUrl);
                break;

            default:
                // Genel paylaşım için fallback
                Alert.alert('Paylaşım Metni', `${message}\n\n${url}`);
                break;
        }
    }

    /**
     * Web'de URL açma yardımcı fonksiyonu
     */
    static openUrlInNewTab(url: string): void {
        try {
            if (typeof window !== 'undefined' && window.open) {
                window.open(url, '_blank');
            } else {
                // React Native Web'de window.open çalışmazsa
                console.log('URL açılacak:', url);
                Alert.alert(
                    'Paylaşım Linki',
                    'Paylaşmak için aşağıdaki linki açın',
                    [
                        { text: 'İptal', style: 'cancel' },
                        {
                            text: 'Kopyala',
                            onPress: async () => {
                                try {
                                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                        await navigator.clipboard.writeText(url);
                                        Alert.alert('Başarılı', 'Link kopyalandı!');
                                    }
                                } catch (e) {
                                    console.log('Clipboard hatası:', e);
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('URL açma hatası:', error);
            Alert.alert('Paylaşım Linki', url);
        }
    }

    /**
     * Web için fallback paylaşım (clipboard)
     */
    static fallbackWebShare(message: string, url: string): void {
        const textToCopy = `${message}\n\n${url}`;
        Alert.alert('Paylaşım Metni', textToCopy);
    }

    /**
     * Manuel kopyalama fallback'i
     */
    static manualCopyFallback(text: string): void {
        Alert.alert('Paylaşım Metni', text);
    }

    /**
     * Belirli bir platforma paylaşım
     */
    static async shareToSpecificPlatform(
        verseData: VerseShareData,
        platform: 'twitter' | 'whatsapp' | 'facebook' | 'telegram'
    ): Promise<void> {
        try {
            const message = this.generatePlatformSpecificText(verseData, platform);
            const url = this.generateVerseUrl(verseData.surahNumber, verseData.verseNumber);

            if (Platform.OS === 'web') {
                // Web'de platform-specific URL'ler oluştur
                this.shareOnWebPlatform(platform, message, url);
            } else if (Share && Social) {
                // Native platformlar için react-native-share
                switch (platform) {
                    case 'twitter':
                        await Share.shareSingle({
                            social: Social.Twitter,
                            message: message,
                        });
                        break;

                    case 'whatsapp':
                        await Share.shareSingle({
                            social: Social.Whatsapp,
                            message: Platform.OS === 'ios' ? message : `${message}\n\n${url}`,
                        });
                        break;

                    case 'facebook':
                        await Share.shareSingle({
                            social: Social.Facebook,
                            message: message,
                            url: url,
                        });
                        break;

                    case 'telegram':
                        await Share.shareSingle({
                            social: Social.Telegram,
                            message: Platform.OS === 'ios' ? message : `${message}\n\n${url}`,
                        });
                        break;
                }
            } else {
                // Fallback: genel paylaşım
                await this.shareVerse(verseData);
            }
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error(`${platform} paylaşım hatası:`, error);

                // Uygulama yüklü değilse genel paylaşıma yönlendir
                if (error?.message?.includes('not installed') || error?.message?.includes('not available')) {
                    Alert.alert(
                        'Uygulama Bulunamadı',
                        `${this.getPlatformName(platform)} uygulaması bulunamadı. Genel paylaşım seçeneklerini kullanmak ister misiniz?`,
                        [
                            { text: 'Hayır', style: 'cancel' },
                            {
                                text: 'Evet',
                                onPress: () => this.shareVerse(verseData)
                            }
                        ]
                    );
                } else {
                    Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu.');
                }
            }
        }
    }

    /**
     * Platforma özel isim döndürür
     */
    private static getPlatformName(platform: string): string {
        const names: Record<string, string> = {
            'twitter': 'Twitter/X',
            'whatsapp': 'WhatsApp',
            'facebook': 'Facebook',
            'telegram': 'Telegram',
        };
        return names[platform] || platform;
    }

    /**
     * Platform ikonları
     */
    static getPlatformIcon(platform: string): string {
        const icons: Record<string, string> = {
            'twitter': '🐦',
            'whatsapp': '💬',
            'facebook': '📘',
            'telegram': '✈️',
            'instagram': '📷',
            'generic': '📤',
        };
        return icons[platform] || '📤';
    }

    /**
     * Kullanılabilir platformların listesi
     */
    static getAvailablePlatforms(): Array<{ id: string; name: string; icon: string }> {
        return [
            { id: 'image', name: 'Resim Olarak Paylaş', icon: '🖼️' },
            { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
            { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
            { id: 'telegram', name: 'Telegram', icon: '✈️' },
            { id: 'facebook', name: 'Facebook', icon: '📘' },
            { id: 'generic', name: 'Metin Olarak Paylaş', icon: '📤' },
        ];
    }
}
