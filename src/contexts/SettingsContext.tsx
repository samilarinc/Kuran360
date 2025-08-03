import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, SettingsContextType } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
    selectedTranslations: [
        'Diyanet İşleri Meali (Yeni)',
        'Elmalılı Hamdi Yazır Meali',
        'Süleymaniye Vakfı Meali'
    ],
    autoplayEnabled: false,
    showTransliteration: true,
    showWordTranslations: true,
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
    'Süleymaniye Vakfı Meali',
    'Süleyman Ateş Meali',
    'Yaşar Nuri Öztürk Meali'
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
