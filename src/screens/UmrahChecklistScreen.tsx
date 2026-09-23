import React, { useState, useEffect } from 'react';
import { View, ScrollView, Linking, Platform, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';
import { TravelPlannerCard } from '@/components/TravelPlannerCard';
import { TransferDateCard } from '@/components/TransferDateCard';
import { NusukLinksSection } from '@/components/NusukLinksSection';
import { ChecklistSection } from '@/components/ChecklistSection';
import { CityOption } from '@/components/CityPickerModal';
import { SPACING } from '@/theme';

interface ChecklistData {
    outboundFrom: string;
    outboundFromName: string;
    outboundTo: 'Mekke' | 'Medine';
    outboundDate: Date | null;

    inboundFrom: 'Mekke' | 'Medine';
    inboundTo: string;
    inboundToName: string;
    inboundDate: Date | null;

    transferDate: Date | null;
    checklist: Record<string, boolean>;
}

const CHECKLIST_ITEM_KEYS: string[] = [
    'planeTicketPurchased',
    'trainTicketPurchased',
    'visaObtained',
    'hotelBooked',
    'ihramReady',
    'clothesReady',
    'nusukReady',
    'phoneSimReady',
    'duaShareReady',
    'currencyReady',
    'dovizEkstreReady',
    'roamingChecked',
    'powerBankReady',
    'mapsDownloaded',
    'duaListPrepared',
    'zikirmatikReady',
    'umrahGuideSaved',
    'bagForHaram',
    'personalMedications',
    'hygieneKit',
];

const TURKISH_CITIES: CityOption[] = [
    { name: 'Ankara', code: 'esb' },
    { name: 'İstanbul (Yeni Havalimanı)', code: 'ist' },
    { name: 'İstanbul (Sabiha Gökçen)', code: 'saw' },
    { name: 'Kayseri', code: 'asr' },
];

const STORAGE_KEY = '@umrah_checklist';

interface UmrahChecklistScreenProps {
    onNavigate: () => void;
    navigation: any;
}

export const UmrahChecklistScreen: React.FC<UmrahChecklistScreenProps> = ({ onNavigate }) => {

    const { common } = useTheme();

    const { t } = useTranslation();
    const styles = useTheme().common;
    const [data, setData] = useState<ChecklistData>({
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
    });

    const [showOutboundPicker, setShowOutboundPicker] = useState(false);
    const [showInboundPicker, setShowInboundPicker] = useState(false);
    const [showOutboundDatePicker, setShowOutboundDatePicker] = useState(false);
    const [showInboundDatePicker, setShowInboundDatePicker] = useState(false);
    const [showTransferDatePicker, setShowTransferDatePicker] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migrate old format: convert individual boolean fields to checklist dict
                let checklist = parsed.checklist || {};
                if (!parsed.checklist) {
                    // Migrate from old individual fields
                    const oldFields = ['ticketPurchased', 'visaObtained', 'ihramReady', 'clothesReady'];
                    oldFields.forEach(field => {
                        if (parsed[field] === true) checklist[field] = true;
                    });
                }
                setData({
                    ...parsed,
                    outboundDate: parsed.outboundDate ? new Date(parsed.outboundDate) : null,
                    inboundDate: parsed.inboundDate ? new Date(parsed.inboundDate) : null,
                    transferDate: parsed.transferDate ? new Date(parsed.transferDate) : null,
                    checklist,
                });
            }
        } catch (error) {
            console.error('Error loading checklist data:', error);
        }
    };

    const saveData = async (newData: ChecklistData) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setData(newData);
        } catch (error) {
            console.error('Error saving checklist data:', error);
        }
    };

    const updateField = (field: keyof ChecklistData, value: any) => {
        const newData = { ...data, [field]: value };
        saveData(newData);
    };

    const toggleChecklistItem = (key: string) => {
        const newChecklist = { ...data.checklist, [key]: !data.checklist[key] };
        updateField('checklist', newChecklist);
    };

    const openLink = async (url: string, label: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(t('umrahChecklistScreen.linkOpenErrorTitle'), t('umrahChecklistScreen.linkOpenError', { label }));
            }
        } catch (error) {
            Alert.alert(t('umrahChecklistScreen.linkOpenErrorTitle'), t('umrahChecklistScreen.linkOpenGenericError'));
        }
    };

    const formatDateForSkyscannerLong = (date: Date | null): string => {
        // Output format: YYYY-MM-DD
        if (!date) return '';

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const formatDateForDisplay = (date: Date | null): string => {
        if (!date) return t('umrahChecklistScreen.selectDate');

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const buildSkyscannerUrl = (): string | null => {
        const outboundCode = data.outboundFrom;
        const inboundCode = data.inboundTo;

        const outboundSaudiCode = data.outboundTo === 'Mekke' ? 'jed' : 'med';
        const inboundSaudiCode = data.inboundFrom === 'Mekke' ? 'jed' : 'med';

        if (!outboundCode || !inboundCode || !data.outboundDate || !data.inboundDate) {
            return null;
        }

        const outboundDate = formatDateForSkyscannerLong(data.outboundDate);
        const inboundDate = formatDateForSkyscannerLong(data.inboundDate);

        return `https://www.skyscanner.com.tr/tasima/d/${outboundCode}/${outboundDate}/${outboundSaudiCode}/${inboundSaudiCode}/${inboundDate}/${inboundCode}?adultsv2=1&cabinclass=economy&childrenv2=&ref=home`;
    };

    const openSkyscanner = () => {
        const url = buildSkyscannerUrl();
        if (url) {
            openLink(url, 'Skyscanner');
        } else {
            Alert.alert(
                t('umrahChecklistScreen.missingInfoTitle'),
                t('umrahChecklistScreen.missingInfoMessage')
            );
        }
    };

    const buildBookingUrl = (city: 'Mekke' | 'Medine', checkin: Date, checkout: Date): string => {
        const cityName = city === 'Mekke' ? 'Mekke' : 'Medine';
        const destId = city === 'Mekke' ? '-3096949' : '-3007680';
        const checkinStr = formatDateForSkyscannerLong(checkin);
        const checkoutStr = formatDateForSkyscannerLong(checkout);
        return `https://www.booking.com/searchresults.tr.html?ss=${cityName}&dest_id=${destId}&dest_type=city&checkin=${checkinStr}&checkout=${checkoutStr}&group_adults=1&no_rooms=1&group_children=0&lang=tr`;
    };

    const openFirstCityHotel = () => {
        if (!data.outboundDate) return;
        const firstCity = data.outboundTo;
        const hasTransfer = firstCity !== data.inboundFrom;
        const checkout = (hasTransfer && data.transferDate) ? data.transferDate : data.inboundDate;
        if (!checkout) return;
        openLink(buildBookingUrl(firstCity, data.outboundDate, checkout), 'Booking.com');
    };

    const openSecondCityHotel = () => {
        if (!data.transferDate || !data.inboundDate) return;
        openLink(buildBookingUrl(data.inboundFrom, data.transferDate, data.inboundDate), 'Booking.com');
    };

    const selectOutboundCity = (city: CityOption) => {
        const newData = {
            ...data,
            outboundFrom: city.code,
            outboundFromName: city.name,
        };
        saveData(newData);
        setShowOutboundPicker(false);
    };

    const selectInboundCity = (city: CityOption) => {
        const newData = {
            ...data,
            inboundTo: city.code,
            inboundToName: city.name,
        };
        saveData(newData);
        setShowInboundPicker(false);
    };

    const onOutboundDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowOutboundDatePicker(false);
        }
        if (selectedDate && event.type !== 'dismissed') {
            updateField('outboundDate', selectedDate);
        }
    };

    const onOutboundDateChangeWeb = (event: any) => {
        const dateString = event.target.value;
        if (dateString) {
            const date = new Date(dateString);
            updateField('outboundDate', date);
        }
    };

    const onInboundDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowInboundDatePicker(false);
        }
        if (selectedDate && event.type !== 'dismissed') {
            updateField('inboundDate', selectedDate);
        }
    };

    const onInboundDateChangeWeb = (event: any) => {
        const dateString = event.target.value;
        if (dateString) {
            const date = new Date(dateString);
            updateField('inboundDate', date);
        }
    };

    const onTransferDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTransferDatePicker(false);
        }
        if (selectedDate && event.type !== 'dismissed') {
            updateField('transferDate', selectedDate);
        }
    };

    const onTransferDateChangeWeb = (event: any) => {
        const dateString = event.target.value;
        if (dateString) {
            const date = new Date(dateString);
            updateField('transferDate', date);
        }
    };

    const formatDateForInput = (date: Date | null): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const needsTransfer = data.outboundTo !== data.inboundFrom;
    const showIhramReminder = data.outboundTo === 'Mekke';

    const cityLabel = (city: 'Mekke' | 'Medine'): string =>
        city === 'Mekke' ? t('umrahChecklistScreen.mekke') : t('umrahChecklistScreen.medine');

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.umrahChecklist')}
                showBackButton={true}
                onBackPress={onNavigate}
                showHomeButton={true}
                onHomePress={onNavigate}
            />
            {/* Web-specific style to clean up the date input appearance */}
            {Platform.OS === 'web' && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* Hide the default placeholder/text when no date is selected */
                    input[type="date"].empty-date {
                        color: transparent;
                    }
                    /* Force the picker indicator to cover everything */
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        cursor: pointer;
                        opacity: 0;
                    }
                    /* Hide the clear button and inner spinner */
                    input[type="date"]::-webkit-inner-spin-button,
                    input[type="date"]::-webkit-clear-button {
                        display: none;
                        -webkit-appearance: none;
                    }
                `}} />
            )}

            <ScrollView style={common.content} showsVerticalScrollIndicator={false}>
                <TravelPlannerCard
                    outboundFromName={data.outboundFromName}
                    outboundTo={data.outboundTo}
                    outboundDate={data.outboundDate}
                    inboundFrom={data.inboundFrom}
                    inboundToName={data.inboundToName}
                    inboundDate={data.inboundDate}
                    transferDate={data.transferDate}
                    needsTransfer={needsTransfer}
                    showIhramReminder={showIhramReminder}
                    cities={TURKISH_CITIES}
                    cityLabel={cityLabel}
                    formatDateForDisplay={formatDateForDisplay}
                    formatDateForInput={formatDateForInput}
                    showOutboundPicker={showOutboundPicker}
                    showInboundPicker={showInboundPicker}
                    showOutboundDatePicker={showOutboundDatePicker}
                    showInboundDatePicker={showInboundDatePicker}
                    onOutboundCityPress={() => setShowOutboundPicker(true)}
                    onOutboundToChange={(city) => updateField('outboundTo', city)}
                    onInboundFromChange={(city) => updateField('inboundFrom', city)}
                    onInboundCityPress={() => setShowInboundPicker(true)}
                    onOutboundDateChangeWeb={onOutboundDateChangeWeb}
                    onInboundDateChangeWeb={onInboundDateChangeWeb}
                    onRequestOutboundDatePicker={() => setShowOutboundDatePicker(true)}
                    onRequestInboundDatePicker={() => setShowInboundDatePicker(true)}
                    onOutboundDateChange={onOutboundDateChange}
                    onInboundDateChange={onInboundDateChange}
                    onSelectOutboundCity={selectOutboundCity}
                    onSelectInboundCity={selectInboundCity}
                    onCloseOutboundPicker={() => setShowOutboundPicker(false)}
                    onCloseInboundPicker={() => setShowInboundPicker(false)}
                    onOpenSkyscanner={openSkyscanner}
                    onOpenFirstCityHotel={openFirstCityHotel}
                    onOpenSecondCityHotel={openSecondCityHotel}
                />

                {needsTransfer && (
                    <TransferDateCard
                        fromCityLabel={cityLabel(data.outboundTo)}
                        toCityLabel={cityLabel(data.inboundFrom)}
                        transferDate={data.transferDate}
                        outboundDate={data.outboundDate}
                        inboundDate={data.inboundDate}
                        formatDateForDisplay={formatDateForDisplay}
                        formatDateForInput={formatDateForInput}
                        showTransferDatePicker={showTransferDatePicker}
                        onChangeWeb={onTransferDateChangeWeb}
                        onRequestDatePicker={() => setShowTransferDatePicker(true)}
                        onDateChange={onTransferDateChange}
                        onOpenTrainTicket={() => openLink('https://sar.hhr.sa/home#/', 'Hızlı Tren')}
                    />
                )}

                <NusukLinksSection
                    onOpenEVisa={() => openLink('https://visa.visitsaudi.com/', 'E-Vize')}
                    onOpenGooglePlay={() => openLink('https://play.google.com/store/apps/details?id=com.moh.nusukapp&hl=tr', t('umrahChecklistScreen.nusukGooglePlay'))}
                    onOpenAppStore={() => openLink('https://apps.apple.com/tr/app/nusuk-%D9%86%D8%B3%D9%83/id6469515422?l=tr', t('umrahChecklistScreen.nusukAppStore'))}
                />

                <ChecklistSection
                    itemKeys={CHECKLIST_ITEM_KEYS}
                    checklist={data.checklist}
                    onToggleItem={toggleChecklistItem}
                />

                <View style={{ height: SPACING.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
};
