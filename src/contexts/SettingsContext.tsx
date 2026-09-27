import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from './AuthContext';
import { AppSettings, SettingsContextType } from '@/types';
import { DEFAULT_ARABIC_FONT_ID, DEFAULT_IMAGE_FONT_ID } from '@/constants/fonts';

const ASYNC_STORAGE_KEY = 'quran_app_settings';

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
    theme: 'light',
    audioTrackingEnabled: true,
    selectedReciter: 'sudais',
    playbackRate: 1.0,
    audioPlayMode: 'stopAtEnd',
    arabicFont: DEFAULT_ARABIC_FONT_ID,
    imageArabicFont: DEFAULT_IMAGE_FONT_ID,
    quranPageFontSize: 28,
    surahFontSize: 24,
    quranPageTranslation: '',
    verseNumberStyle: 'latin',
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
    },
    {
        id: 'yasser',
        name: 'Yasser Ad-Dussary',
        folder: 'yasser_all_verse'
    }
];

const readLocalSettings = async (): Promise<AppSettings> => {
    const localSettings = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    return localSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(localSettings) } : DEFAULT_SETTINGS;
};

const fetchSettings = async (userId?: string): Promise<AppSettings> => {
    if (!userId) {
        return readLocalSettings();
    }

    try {
        const ref = doc(db, 'users', userId, 'meta', 'settings');
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const cloud = snap.data() as Partial<AppSettings>;
            const merged = { ...DEFAULT_SETTINGS, ...cloud };
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(merged));
            return merged;
        }
        const initialSettings = await readLocalSettings();
        await setDoc(ref, initialSettings);
        return initialSettings;
    } catch (error) {
        // Offline / Firestore unreachable — fall back to the last known local settings
        // instead of resetting the user's preferences to defaults.
        console.error('Error loading settings from Firestore, falling back to local cache:', error);
        return readLocalSettings();
    }
};

const persistSettings = async (settings: AppSettings, userId?: string) => {
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(settings));
    if (userId) {
        try {
            const ref = doc(db, 'users', userId, 'meta', 'settings');
            await setDoc(ref, settings, { merge: true });
        } catch (error) {
            // Offline — the AsyncStorage write above already succeeded, Firestore
            // will pick up the latest local value next time updateSettings runs online.
            console.error('Error saving settings to Firestore:', error);
        }
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['settings', user?.uid ?? 'anon'];

    const { data: settings = DEFAULT_SETTINGS } = useQuery({
        queryKey,
        queryFn: () => fetchSettings(user?.uid),
    });

    const mutation = useMutation({
        mutationFn: (updated: AppSettings) => persistSettings(updated, user?.uid),
    });

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        const updated = { ...settings, ...newSettings };
        queryClient.setQueryData(queryKey, updated);
        mutation.mutate(updated);
    };


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
