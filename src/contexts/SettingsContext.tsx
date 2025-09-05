import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, SettingsContextType } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
    selectedTranslations: [
        'Diyanet İşleri Meali (Yeni)',
        'Elmalılı Meali (Orijinal)',
        'Yaşar Nuri Öztürk Meali'
    ],
    favoriteTranslation: 'Diyanet İşleri Meali (Yeni)', // Varsayılan favori meal
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
    'Yaşar Nuri Öztürk Meali'
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
    {
        id: 'minshawi_mujawwad',
        name: 'Muhammad Siddiq Al-Minshawi - Mujawwad',
        folder: 'minshawy_mujawwad_all_verse'
    },
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

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('quran_app_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);
            await AsyncStorage.setItem('quran_app_settings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
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
