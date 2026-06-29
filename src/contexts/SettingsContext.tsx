import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { AppSettings, SettingsContextType } from '../types';
import { DEFAULT_ARABIC_FONT_ID, DEFAULT_IMAGE_FONT_ID, getFontOption, loadGoogleFont } from '../constants/fonts';

const DEFAULT_SETTINGS: AppSettings = {
    selectedTranslations: [
        'Kur\'an Yolu (Diyanet İşleri)',
        'Elmalılı Meali (Orijinal)',
        'Ali Bulaç Meali'
    ],
    favoriteTranslation: 'Kur\'an Yolu (Diyanet İşleri)',
    autoplayEnabled: false,
    showTransliteration: true,
    showWordTranslations: true,
    inlineWordTranslations: false,
    usePaginatedView: false,
    darkMode: false,
    audioTrackingEnabled: true,
    selectedReciter: 'sudais',
    playbackRate: 1.0,
    audioPlayMode: 'stopAtEnd',
    arabicFont: DEFAULT_ARABIC_FONT_ID,
    imageArabicFont: DEFAULT_IMAGE_FONT_ID,
    prayerLocation: {
        id: '9541',
        cityName: 'Istanbul',
    },
    useGPSForPrayer: false,
};

// Available translations from the JSON data
const AVAILABLE_TRANSLATIONS = [
    'Abdulbaki Gölpınarlı Meali',
    'Abdullah-Ahmet Akgül Meali',
    'Abdullah Parlıyan Meali',
    'Ahmet Tekin Meali',
    'Ahmet Varol Meali',
    'Ali Bulaç Meali',
    'Ali Fikri Yavuz Meali',
    'Bahaeddin Sağlam Meali',
    'Bayraktar Bayraklı Meali',
    'Besim Atalay Meali (1965)',
    'Cemal Külünkoğlu Meali',
    'Cemil Said (1924)',
    'Diyanet İşleri Meali (Eski)',
    'Diyanet İşleri Meali (Yeni)',
    'Kur\'an Yolu (Diyanet İşleri)',
    'Diyanet Vakfı Meali',
    'Edip Yüksel Meali',
    'Elmalılı Hamdi Yazır Meali',
    'Elmalılı Meali (Orijinal)',
    'Emrah Demiryent Meali',
    'Erhan Aktaş Meali',
    'Hasan Basri Çantay Meali',
    'Haydar Öztürk-Serkan Yılmaz Meali',
    'Hayrat Neşriyat Meali',
    'İhsan Aktaş Meali',
    'İlyas Yorulmaz Meali',
    'İsmayıl Hakkı Baltacıoğlu',
    'İsmail Hakkı İzmirli',
    'İsmail Yakıt',
    'Kadri Çelik Meali',
    'Mahmut Kısa Meali',
    'Mahmut Özdemir Meali',
    'Mehmet Çakır Meali',
    'Mehmet Çoban Meali',
    'Mehmet Okuyan Meali',
    'Mehmet Türk Meali',
    'Muhammed Esed Meali',
    'Mustafa Çavdar Meali',
    'Mustafa İslamoğlu Meali',
    'Orhan Kuntman Meali',
    'Osman Fırat Meali',
    'Ömer Nasuhi Bilmen Meali',
    'Suat Yıldırım Meali',
    'Şaban Piriş Meali',
    'Ümit Şimşek Meali',
    'Eski Anadolu Türkçesi',
    'Satıraltı Meal (1534)',
    'Bunyadov-Memmedeliyev',
    'M. Pickthall (English)',
    'Yusuf Ali (English)',
    'Süleyman Tevfik (1927)',
    'Süleymaniye Vakfı Meali',
    'Süleyman Ateş Meali',
    'Yaşar Nuri Öztürk Meali',
    'Ömer Çelik Meali',
    'Diyanet İşleri Kürtçe Meali (Latin)',
    'Diyanet İşleri Kürtçe Meali (Arapça)',
    'Özbek Diyanet Meali',
    'Özbekçe (Latin)',
];

// Available reciters
const AVAILABLE_RECITERS = [
    {
        id: 'sudais',
        name: 'Abdul Rahman Al-Sudais',
        folder: 'sudais_all_verse'
    },
    {
        id: 'abdulsamad',
        name: 'Abdul Basit Abdul Samad',
        folder: 'abdulsamad_all_verse'
    },
    {
        id: 'nasser',
        name: 'Nasser Alqatami',
        folder: 'nasser_all_verse'
    },
    {
        id: 'minshawi_murattal',
        name: 'Muhammad Siddiq Al-Minshawi - Murattal',
        folder: 'minshawy_murattal_all_verse'
    },
    // {
    //     id: 'minshawi_mujawwad',
    //     name: 'Muhammad Siddiq Al-Minshawi - Mujawwad',
    //     folder: 'minshawy_mujawwad_all_verse'
    // },
    {
        id: 'abubakr',
        name: 'Abu Bakr Al-Shatri',
        folder: 'abubakr_all_verse'
    },
    {
        id: 'ghamidi',
        name: 'Muhammad Al-Ghamidi',
        folder: 'ghamidi_all_verse'
    }
];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const { user } = useAuth();

    useEffect(() => {
        loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const loadSettings = async () => {
        try {
            if (user?.uid) {
                console.log('🔄 Loading settings from Firestore for user:', user.uid);
                const ref = doc(db, 'users', user.uid, 'meta', 'settings');
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const cloud = snap.data() as Partial<AppSettings>;
                    const mergedSettings = { ...DEFAULT_SETTINGS, ...cloud };
                    setSettings(mergedSettings);
                    await AsyncStorage.setItem('quran_app_settings', JSON.stringify(mergedSettings));
                    console.log('✅ Settings loaded from Firestore and synced locally');
                    return;
                } else {
                    console.log('📄 No Firestore settings found, creating initial document');
                    // Create initial settings document with current local settings
                    const localSettings = await AsyncStorage.getItem('quran_app_settings');
                    const initialSettings = localSettings ?
                        { ...DEFAULT_SETTINGS, ...JSON.parse(localSettings) } :
                        DEFAULT_SETTINGS;
                    await setDoc(ref, initialSettings);
                    setSettings(initialSettings);
                    return;
                }
            }

            // fallback local
            console.log('💾 Loading settings from local storage (no user)');
            const savedSettings = await AsyncStorage.getItem('quran_app_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
                console.log('✅ Settings loaded from local storage');
            } else {
                console.log('🆕 Using default settings');
            }
        } catch (error) {
            console.error('❌ Error loading settings:', error);
        }
    };

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);

            // Always save to AsyncStorage
            await AsyncStorage.setItem('quran_app_settings', JSON.stringify(updatedSettings));

            // Save to Firestore if user is logged in
            if (user?.uid) {
                try {
                    const ref = doc(db, 'users', user.uid, 'meta', 'settings');
                    await setDoc(ref, updatedSettings, { merge: true });
                    console.log('✅ Settings saved to Firestore for user:', user.uid);
                } catch (firestoreError) {
                    console.error('❌ Error saving to Firestore:', firestoreError);
                }
            } else {
                console.log('ℹ️ Settings saved locally (no user logged in)');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    // Load selected Arabic fonts from Google Fonts when settings change
    useEffect(() => {
        loadGoogleFont(getFontOption(settings.arabicFont));
        loadGoogleFont(getFontOption(settings.imageArabicFont));
    }, [settings.arabicFont, settings.imageArabicFont]);

    const contextValue: SettingsContextType = {
        settings,
        updateSettings,
        availableTranslations: AVAILABLE_TRANSLATIONS,
        availableReciters: AVAILABLE_RECITERS,
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
