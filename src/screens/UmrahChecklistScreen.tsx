import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Linking,
    Platform,
    SafeAreaView,
    Alert,
    Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { SPACING, FONT_SIZES } from '../theme';

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

type CityOption = {
    name: string;
    code: string;
};

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

export const UmrahChecklistScreen: React.FC<UmrahChecklistScreenProps> = ({ onNavigate, navigation }) => {

    const { theme } = useTheme();
    const { t } = useTranslation();
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

    const formatDateForSkyscanner = (date: Date | null): string => {
        // Output format: YYMMDD
        if (!date) return '';

        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return `${year}${month}${day}`;
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title={t('screenTitles.umrahChecklist')}
                showBackButton={true}
                onBackPress={onNavigate}
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* COMPACT TRAVEL PLAN CARD */}
                <View style={[styles.plannerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.plannerTitle, { color: theme.text }]}>
                        {t('umrahChecklistScreen.travelPlan')}
                    </Text>

                    {/* Outbound Row */}
                    <View style={styles.compactTripRow}>
                        <View style={styles.compactTripMain}>
                            <View style={styles.compactCitySelect}>
                                <TouchableOpacity
                                    style={[styles.cityChip, { backgroundColor: theme.background, borderColor: theme.border }]}
                                    onPress={() => setShowOutboundPicker(true)}
                                >
                                    <Text style={[styles.cityChipText, { color: data.outboundFromName ? theme.text : theme.textSecondary }]}>
                                        {data.outboundFromName || t('umrahChecklistScreen.from')}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>▼</Text>
                                </TouchableOpacity>

                                <Text style={[styles.tripArrow, { color: theme.textSecondary }]}>➔</Text>

                                <View style={styles.destinationChips}>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            { borderColor: theme.border },
                                            data.outboundTo === 'Mekke' && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => updateField('outboundTo', 'Mekke')}
                                    >
                                        <Text style={[styles.destinationChipText, { color: data.outboundTo === 'Mekke' ? '#FFFFFF' : theme.text }]}>{cityLabel('Mekke')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            { borderColor: theme.border },
                                            data.outboundTo === 'Medine' && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => updateField('outboundTo', 'Medine')}
                                    >
                                        <Text style={[styles.destinationChipText, { color: data.outboundTo === 'Medine' ? '#FFFFFF' : theme.text }]}>{cityLabel('Medine')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Outbound Date Row */}
                            <View style={styles.compactDateRow}>
                                <Text style={[styles.compactDateLabel, { color: theme.textSecondary }]}>{t('umrahChecklistScreen.outbound')}</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={{ flex: 1, position: 'relative', height: 35, justifyContent: 'center' }}>
                                        <Text style={[styles.compactDateText, { color: data.outboundDate ? theme.primary : theme.textSecondary }]}>
                                            {formatDateForDisplay(data.outboundDate)}
                                        </Text>
                                        <input
                                            type="date"
                                            value={formatDateForInput(data.outboundDate)}
                                            onChange={onOutboundDateChangeWeb}
                                            min={formatDateForInput(new Date())}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'pointer',
                                                zIndex: 2,
                                                border: 'none',
                                                outline: 'none',
                                                // @ts-ignore
                                                appearance: 'none'
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => setShowOutboundDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.compactDateText, { color: data.outboundDate ? theme.primary : theme.textSecondary }]}>
                                            {formatDateForDisplay(data.outboundDate)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={[styles.plannerDivider, { backgroundColor: theme.border }]} />

                    {/* Inbound Row */}
                    <View style={styles.compactTripRow}>
                        <View style={styles.compactTripMain}>
                            <View style={styles.compactCitySelect}>
                                <View style={styles.destinationChips}>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            { borderColor: theme.border },
                                            data.inboundFrom === 'Mekke' && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => updateField('inboundFrom', 'Mekke')}
                                    >
                                        <Text style={[styles.destinationChipText, { color: data.inboundFrom === 'Mekke' ? '#FFFFFF' : theme.text }]}>{cityLabel('Mekke')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            { borderColor: theme.border },
                                            data.inboundFrom === 'Medine' && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => updateField('inboundFrom', 'Medine')}
                                    >
                                        <Text style={[styles.destinationChipText, { color: data.inboundFrom === 'Medine' ? '#FFFFFF' : theme.text }]}>{cityLabel('Medine')}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.tripArrow, { color: theme.textSecondary }]}>➔</Text>

                                <TouchableOpacity
                                    style={[styles.cityChip, { backgroundColor: theme.background, borderColor: theme.border }]}
                                    onPress={() => setShowInboundPicker(true)}
                                >
                                    <Text style={[styles.cityChipText, { color: data.inboundToName ? theme.text : theme.textSecondary }]}>
                                        {data.inboundToName || t('umrahChecklistScreen.to')}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>▼</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Inbound Date Row */}
                            <View style={styles.compactDateRow}>
                                <Text style={[styles.compactDateLabel, { color: theme.textSecondary }]}>{t('umrahChecklistScreen.inbound')}</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={{ flex: 1, position: 'relative', height: 35, justifyContent: 'center' }}>
                                        <Text style={[styles.compactDateText, { color: data.inboundDate ? theme.primary : theme.textSecondary }]}>
                                            {formatDateForDisplay(data.inboundDate)}
                                        </Text>
                                        <input
                                            type="date"
                                            value={formatDateForInput(data.inboundDate)}
                                            onChange={onInboundDateChangeWeb}
                                            min={formatDateForInput(data.outboundDate || new Date())}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'pointer',
                                                zIndex: 2,
                                                border: 'none',
                                                outline: 'none',
                                                // @ts-ignore
                                                appearance: 'none'
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => setShowInboundDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.compactDateText, { color: data.inboundDate ? theme.primary : theme.textSecondary }]}>
                                            {formatDateForDisplay(data.inboundDate)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Travel Action Buttons - Show only if dates are selected */}
                        {data.outboundDate && data.inboundDate && (
                            <View style={styles.plannerActions}>
                                <TouchableOpacity
                                    style={[styles.plannerActionBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
                                    onPress={openSkyscanner}
                                >
                                    <Text style={[styles.plannerActionBtnText, { color: theme.primary }]}>✈️ Uçak</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.plannerActionBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
                                    onPress={openFirstCityHotel}
                                >
                                    <Text style={[styles.plannerActionBtnText, { color: theme.primary }]}>{t('umrahChecklistScreen.hotel', { city: cityLabel(data.outboundTo) })}</Text>
                                </TouchableOpacity>
                                {needsTransfer && data.transferDate && (
                                    <TouchableOpacity
                                        style={[styles.plannerActionBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
                                        onPress={openSecondCityHotel}
                                    >
                                        <Text style={[styles.plannerActionBtnText, { color: theme.primary }]}>{t('umrahChecklistScreen.hotel', { city: cityLabel(data.inboundFrom) })}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Modals and Pickers */}
                    <Modal visible={showOutboundPicker} transparent animationType="fade" onRequestClose={() => setShowOutboundPicker(false)}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOutboundPicker(false)}>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('umrahChecklistScreen.whereFrom')}</Text>
                                {TURKISH_CITIES.map((city) => (
                                    <TouchableOpacity key={city.code} style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => selectOutboundCity(city)}>
                                        <Text style={[styles.modalOptionText, { color: theme.text }]}>{city.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <Modal visible={showInboundPicker} transparent animationType="fade" onRequestClose={() => setShowInboundPicker(false)}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInboundPicker(false)}>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('umrahChecklistScreen.whereTo')}</Text>
                                {TURKISH_CITIES.map((city) => (
                                    <TouchableOpacity key={city.code} style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => selectInboundCity(city)}>
                                        <Text style={[styles.modalOptionText, { color: theme.text }]}>{city.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {Platform.OS !== 'web' && showOutboundDatePicker && (
                        <DateTimePicker value={data.outboundDate || new Date()} mode="date" display="default" onChange={onOutboundDateChange} minimumDate={new Date()} />
                    )}
                    {Platform.OS !== 'web' && showInboundDatePicker && (
                        <DateTimePicker value={data.inboundDate || new Date()} mode="date" display="default" onChange={onInboundDateChange} minimumDate={data.outboundDate || new Date()} />
                    )}

                    {showIhramReminder && (
                        <View style={[styles.compactReminder, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.compactReminderText, { color: theme.primary }]}>
                                {t('umrahChecklistScreen.ihramReminder')}
                            </Text>
                        </View>
                    )}
                </View>


                {/* COMPACT TRANSFER DATE (if needed) */}
                {needsTransfer && (
                    <View style={[styles.plannerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.plannerTitle, { color: theme.text }]}>
                            {t('umrahChecklistScreen.cityTransfer')}
                        </Text>
                        <Text style={[styles.compactReminderText, { color: theme.textSecondary, textAlign: 'left', marginBottom: SPACING.sm }]}>
                            {t('umrahChecklistScreen.transferDateDescription', { from: cityLabel(data.outboundTo), to: cityLabel(data.inboundFrom) })}
                        </Text>

                        {/* Compact Date Row for Transfer */}
                        <View style={styles.compactDateRow}>
                            <Text style={[styles.compactDateLabel, { color: theme.textSecondary }]}>{t('umrahChecklistScreen.date')}</Text>
                            {Platform.OS === 'web' ? (
                                <View style={{ flex: 1, position: 'relative', height: 35, justifyContent: 'center' }}>
                                    <Text style={[styles.compactDateText, { color: data.transferDate ? theme.primary : theme.textSecondary }]}>
                                        {formatDateForDisplay(data.transferDate)}
                                    </Text>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.transferDate)}
                                        onChange={onTransferDateChangeWeb}
                                        min={formatDateForInput(data.outboundDate || new Date())}
                                        max={data.inboundDate ? formatDateForInput(data.inboundDate) : undefined}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer',
                                            zIndex: 2,
                                            border: 'none',
                                            outline: 'none',
                                            // @ts-ignore
                                            appearance: 'none'
                                        }}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => setShowTransferDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.compactDateText, { color: data.transferDate ? theme.primary : theme.textSecondary }]}>
                                        {formatDateForDisplay(data.transferDate)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Train Button - Show only if transfer date is selected */}
                        {data.transferDate && (
                            <TouchableOpacity
                                style={[styles.plannerActionBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary, minHeight: 44 }]}
                                onPress={() => openLink('https://sar.hhr.sa/home#/', 'Hızlı Tren')}
                            >
                                <Text style={[styles.plannerActionBtnText, { color: theme.primary }]}>{t('umrahChecklistScreen.trainTicket')}</Text>
                            </TouchableOpacity>
                        )}

                        {Platform.OS !== 'web' && showTransferDatePicker && (
                            <DateTimePicker
                                value={data.transferDate || data.outboundDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={onTransferDateChange}
                                minimumDate={data.outboundDate || new Date()}
                                maximumDate={data.inboundDate || undefined}
                            />
                        )}
                    </View>
                )}

                {/* External Links Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.linkButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openLink('https://visa.visitsaudi.com/', 'E-Vize')}
                    >
                        <Text style={[styles.linkButtonText, { color: theme.text }]}>
                            {t('umrahChecklistScreen.eVisa')}
                        </Text>
                    </TouchableOpacity>

                    <View style={[styles.nusukCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.nusukTitle, { color: theme.text }]}>
                            {t('umrahChecklistScreen.nusukTitle')}
                        </Text>
                        <Text style={[styles.nusukDesc, { color: theme.textSecondary }]}>
                            {t('umrahChecklistScreen.nusukDescription')}
                        </Text>
                        <View style={styles.appButtonsRow}>
                            <TouchableOpacity
                                style={[styles.appButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
                                onPress={() => openLink('https://play.google.com/store/apps/details?id=com.moh.nusukapp&hl=tr', t('umrahChecklistScreen.nusukGooglePlay'))}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="logo-google-playstore" size={18} color={theme.primary} />
                                    <Text style={[styles.appButtonText, { color: theme.primary }]}>{t('umrahChecklistScreen.googlePlay')}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.appButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
                                onPress={() => openLink('https://apps.apple.com/tr/app/nusuk-%D9%86%D8%B3%D9%83/id6469515422?l=tr', t('umrahChecklistScreen.nusukAppStore'))}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="logo-apple-appstore" size={18} color={theme.primary} />
                                    <Text style={[styles.appButtonText, { color: theme.primary }]}>{t('umrahChecklistScreen.appStore')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Checklist Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        {t('umrahChecklistScreen.checklistTitle')}
                    </Text>

                    {CHECKLIST_ITEM_KEYS.map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[styles.checklistItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => toggleChecklistItem(key)}
                        >
                            <View style={[
                                styles.checkbox,
                                { borderColor: theme.border },
                                data.checklist[key] && { backgroundColor: theme.primary }
                            ]}>
                                {data.checklist[key] && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[
                                styles.checklistText,
                                { color: theme.text },
                                data.checklist[key] && styles.checkedText
                            ]}>
                                {t(`umrahChecklistScreen.items.${key}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: SPACING.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
    },
    plannerCard: {
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SPACING.lg,
    },
    plannerTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
    },
    compactTripRow: {
        paddingVertical: SPACING.xs,
    },
    compactTripMain: {
        gap: SPACING.sm,
    },
    compactCitySelect: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cityChip: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        gap: 4,
    },
    cityChipText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    tripArrow: {
        fontSize: 16,
    },
    destinationChips: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
    },
    destinationChip: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    destinationChipText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    compactDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingLeft: SPACING.xs,
    },
    compactDateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    compactDateText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
    },
    plannerDivider: {
        height: 1,
        marginVertical: SPACING.md,
        opacity: 0.5,
    },
    plannerActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    plannerActionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plannerActionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    compactReminder: {
        marginTop: SPACING.md,
        padding: SPACING.sm,
        borderRadius: 10,
    },
    compactReminderText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    label: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.medium,
    },
    pickerButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.medium,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: {
        fontSize: FONT_SIZES.medium,
    },
    pickerArrow: {
        fontSize: FONT_SIZES.small,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: SPACING.lg,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    modalOption: {
        padding: SPACING.md,
        borderBottomWidth: 1,
    },
    modalOptionText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
    },
    destinationButtons: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    destinationButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        alignItems: 'center',
    },
    destinationButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    destinationButtonSmall: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 6,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    destinationButtonTextSmall: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    dateButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: FONT_SIZES.medium,
    },
    reminder: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
    },
    reminderText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    infoText: {

        fontSize: FONT_SIZES.small,
        marginBottom: SPACING.sm,
        fontStyle: 'italic',
    },
    linkButton: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        alignItems: 'center',
    },
    linkButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    appLinks: {
        marginTop: SPACING.md,
    },
    appLinksTitle: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.sm,
    },
    nusukCard: {
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: SPACING.sm,
    },
    nusukTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    nusukDesc: {
        fontSize: FONT_SIZES.small,
        marginBottom: SPACING.md,
    },
    appButtonsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    appButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appButtonText: {
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checklistText: {
        fontSize: FONT_SIZES.medium,
        flex: 1,
    },
    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
});
