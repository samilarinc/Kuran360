import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Linking, Platform, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ExternalLink, TrainFront } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';
import { TravelPlannerCard } from '@/components/TravelPlannerCard';
import { ChecklistSection, ChecklistGroup, ChecklistLink, customKey } from '@/components/ChecklistSection';
import { CityOption } from '@/components/CityPickerModal';
import {
    HolyCity, UmrahTripData, buildSkyscannerUrl, buildBookingUrl,
    HARAMAIN_TRAIN_URL, SAUDI_EVISA_URL, NUSUK_PLAY_URL, NUSUK_APP_STORE_URL,
} from '@/utils/umrahTrip';
import { SPACING } from '@/theme';

const CHECKLIST_GROUPS: ChecklistGroup[] = [
    {
        key: 'documents',
        itemKeys: ['planeTicketPurchased', 'visaObtained', 'hotelBooked', 'trainTicketPurchased', 'nusukReady'],
    },
    {
        key: 'worship',
        itemKeys: ['ihramReady', 'duaListPrepared', 'duaShareReady', 'zikirmatikReady', 'umrahGuideSaved'],
    },
    {
        key: 'phoneMoney',
        itemKeys: ['phoneSimReady', 'roamingChecked', 'mapsDownloaded', 'powerBankReady', 'currencyReady', 'dovizEkstreReady'],
    },
    {
        key: 'bag',
        itemKeys: ['clothesReady', 'bagForHaram', 'personalMedications', 'hygieneKit'],
    },
];

const TURKISH_CITIES: CityOption[] = [
    { name: 'Ankara', code: 'esb' },
    { name: 'İstanbul (Yeni Havalimanı)', code: 'ist' },
    { name: 'İstanbul (Sabiha Gökçen)', code: 'saw' },
    { name: 'Kayseri', code: 'asr' },
];

const STORAGE_KEY = '@umrah_checklist';

const EMPTY_TRIP: UmrahTripData = {
    outboundFrom: '',
    outboundFromName: '',
    outboundTo: 'Mekke',
    outboundDate: null,
    inboundFrom: 'Mekke',
    inboundTo: '',
    inboundToName: '',
    inboundDate: null,
    transferDate: null,
    checklist: {},
    customItems: [],
};

interface UmrahChecklistScreenProps {
    onNavigate: () => void;
    navigation: any;
}

export const UmrahChecklistScreen: React.FC<UmrahChecklistScreenProps> = ({ onNavigate }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const [trip, setTrip] = useState<UmrahTripData>(EMPTY_TRIP);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (!stored) return;
                const parsed = JSON.parse(stored);
                // Oldest format kept each item as its own boolean field
                const checklist: Record<string, boolean> = parsed.checklist || {};
                if (!parsed.checklist) {
                    ['ticketPurchased', 'visaObtained', 'ihramReady', 'clothesReady'].forEach((field) => {
                        if (parsed[field] === true) checklist[field] = true;
                    });
                }
                setTrip({
                    ...EMPTY_TRIP,
                    ...parsed,
                    outboundDate: parsed.outboundDate ? new Date(parsed.outboundDate) : null,
                    inboundDate: parsed.inboundDate ? new Date(parsed.inboundDate) : null,
                    transferDate: parsed.transferDate ? new Date(parsed.transferDate) : null,
                    checklist,
                    customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
                });
            } catch (error) {
                console.error('Error loading checklist data:', error);
            }
        })();
    }, []);

    const update = (patch: Partial<UmrahTripData>) => {
        setTrip((prev) => {
            const next = { ...prev, ...patch };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
                console.error('Error saving checklist data:', error),
            );
            return next;
        });
    };

    const openLink = async (url: string, label: string) => {
        try {
            if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
            } else {
                Alert.alert(t('umrahChecklistScreen.linkOpenErrorTitle'), t('umrahChecklistScreen.linkOpenError', { label }));
            }
        } catch {
            Alert.alert(t('umrahChecklistScreen.linkOpenErrorTitle'), t('umrahChecklistScreen.linkOpenGenericError'));
        }
    };

    const openFlights = () => {
        const url = buildSkyscannerUrl(trip);
        if (url) openLink(url, 'Skyscanner');
        else Alert.alert(t('umrahChecklistScreen.missingInfoTitle'), t('umrahChecklistScreen.missingInfoMessage'));
    };

    const openHotel = (city: HolyCity, checkin: Date, checkout: Date) =>
        openLink(buildBookingUrl(city, checkin, checkout), 'Booking.com');

    const toggleItem = (key: string) =>
        setTrip((prev) => {
            const next = { ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
            return next;
        });

    const addCustom = (text: string) =>
        update({ customItems: [...trip.customItems, { id: Date.now().toString(36), text }] });

    const removeCustom = (id: string) => {
        const { [customKey(id)]: _removed, ...checklist } = trip.checklist;
        update({ customItems: trip.customItems.filter((c) => c.id !== id), checklist });
    };

    const linkIcon = <ExternalLink size={12} color={theme.iconPrimary} />;

    const renderLinks = (key: string) => {
        switch (key) {
            case 'visaObtained':
                return <ChecklistLink label={t('umrahChecklistScreen.eVisaLabel')} icon={linkIcon} onPress={() => openLink(SAUDI_EVISA_URL, 'E-Vize')} />;
            case 'trainTicketPurchased':
                return (
                    <ChecklistLink
                        label={t('umrahChecklistScreen.trainLabel')}
                        icon={<TrainFront size={12} color={theme.iconPrimary} />}
                        onPress={() => openLink(HARAMAIN_TRAIN_URL, t('umrahChecklistScreen.trainLabel'))}
                    />
                );
            case 'nusukReady': {
                const play = (
                    <ChecklistLink
                        key="play"
                        label={t('umrahChecklistScreen.googlePlay')}
                        icon={<Ionicons name="logo-google-playstore" size={12} color={theme.iconPrimary} />}
                        onPress={() => openLink(NUSUK_PLAY_URL, t('umrahChecklistScreen.nusukGooglePlay'))}
                    />
                );
                const appStore = (
                    <ChecklistLink
                        key="ios"
                        label={t('umrahChecklistScreen.appStore')}
                        icon={<Ionicons name="logo-apple-appstore" size={12} color={theme.iconPrimary} />}
                        onPress={() => openLink(NUSUK_APP_STORE_URL, t('umrahChecklistScreen.nusukAppStore'))}
                    />
                );
                if (Platform.OS === 'android') return play;
                if (Platform.OS === 'ios') return appStore;
                return <View style={common.gapXs}>{play}{appStore}</View>;
            }
            default:
                return null;
        }
    };

    const renderHint = (key: string) =>
        key === 'nusukReady' ? <Text style={common.smallText}>{t('umrahChecklistScreen.nusukDescription')}</Text> : null;

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.umrahChecklist')}
                showBackButton={true}
                onBackPress={onNavigate}
                showHomeButton={true}
                onHomePress={onNavigate}
            />

            <ScrollView style={common.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={[common.groupLabel, { marginTop: SPACING.sm }]}>{t('umrahChecklistScreen.travelPlan')}</Text>
                <TravelPlannerCard
                    trip={trip}
                    cities={TURKISH_CITIES}
                    onChange={update}
                    onOpenFlights={openFlights}
                    onOpenHotel={openHotel}
                    onOpenTrain={() => openLink(HARAMAIN_TRAIN_URL, t('umrahChecklistScreen.trainLabel'))}
                />

                <ChecklistSection
                    groups={CHECKLIST_GROUPS}
                    checklist={trip.checklist}
                    customItems={trip.customItems}
                    onToggleItem={toggleItem}
                    onAddCustom={addCustom}
                    onRemoveCustom={removeCustom}
                    renderHint={renderHint}
                    renderLinks={renderLinks}
                />

                <View style={{ height: SPACING.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
};
