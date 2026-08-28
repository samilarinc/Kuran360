import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Linking,
    Platform,
    SafeAreaView,
    Alert,
    Modal,
    StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Plane, Hotel, Lightbulb, TrainFront, FileText, Landmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { AppButton } from '../components/AppButton';
import { createStyles, webDateInputStyle } from './UmrahChecklistScreen.styles';

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
    const styles = useMemo(() => createStyles(theme), [theme]);
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* COMPACT TRAVEL PLAN CARD */}
                <View style={styles.plannerCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Plane size={16} color={theme.text} />
                        <Text style={[styles.plannerTitle, { marginBottom: 0 }]}>
                            {t('umrahChecklistScreen.travelPlan')}
                        </Text>
                    </View>

                    {/* Outbound Row */}
                    <View style={styles.compactTripRow}>
                        <View style={styles.compactTripMain}>
                            <View style={styles.compactCitySelect}>
                                <TouchableOpacity
                                    style={styles.cityChip}
                                    onPress={() => setShowOutboundPicker(true)}
                                >
                                    <Text style={[styles.cityChipText, data.outboundFromName ? styles.cityChipTextFilled : styles.cityChipTextPlaceholder]}>
                                        {data.outboundFromName || t('umrahChecklistScreen.from')}
                                    </Text>
                                    <Text style={styles.chipDropdownArrow}>▼</Text>
                                </TouchableOpacity>

                                <Text style={styles.tripArrow}>➔</Text>

                                <View style={styles.destinationChips}>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            data.outboundTo === 'Mekke' && styles.destinationChipActive
                                        ]}
                                        onPress={() => updateField('outboundTo', 'Mekke')}
                                    >
                                        <Text style={[styles.destinationChipText, data.outboundTo === 'Mekke' && styles.destinationChipTextActive]}>{cityLabel('Mekke')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            data.outboundTo === 'Medine' && styles.destinationChipActive
                                        ]}
                                        onPress={() => updateField('outboundTo', 'Medine')}
                                    >
                                        <Text style={[styles.destinationChipText, data.outboundTo === 'Medine' && styles.destinationChipTextActive]}>{cityLabel('Medine')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Outbound Date Row */}
                            <View style={styles.compactDateRow}>
                                <Text style={styles.compactDateLabel}>{t('umrahChecklistScreen.outbound')}</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={styles.webDateInputWrapper}>
                                        <Text style={[styles.compactDateText, data.outboundDate ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                                            {formatDateForDisplay(data.outboundDate)}
                                        </Text>
                                        <input
                                            type="date"
                                            value={formatDateForInput(data.outboundDate)}
                                            onChange={onOutboundDateChangeWeb}
                                            min={formatDateForInput(new Date())}
                                            style={webDateInputStyle}
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.dateTouchable}
                                        onPress={() => setShowOutboundDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.compactDateText, data.outboundDate ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                                            {formatDateForDisplay(data.outboundDate)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.plannerDivider} />

                    {/* Inbound Row */}
                    <View style={styles.compactTripRow}>
                        <View style={styles.compactTripMain}>
                            <View style={styles.compactCitySelect}>
                                <View style={styles.destinationChips}>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            data.inboundFrom === 'Mekke' && styles.destinationChipActive
                                        ]}
                                        onPress={() => updateField('inboundFrom', 'Mekke')}
                                    >
                                        <Text style={[styles.destinationChipText, data.inboundFrom === 'Mekke' && styles.destinationChipTextActive]}>{cityLabel('Mekke')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.destinationChip,
                                            data.inboundFrom === 'Medine' && styles.destinationChipActive
                                        ]}
                                        onPress={() => updateField('inboundFrom', 'Medine')}
                                    >
                                        <Text style={[styles.destinationChipText, data.inboundFrom === 'Medine' && styles.destinationChipTextActive]}>{cityLabel('Medine')}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.tripArrow}>➔</Text>

                                <TouchableOpacity
                                    style={styles.cityChip}
                                    onPress={() => setShowInboundPicker(true)}
                                >
                                    <Text style={[styles.cityChipText, data.inboundToName ? styles.cityChipTextFilled : styles.cityChipTextPlaceholder]}>
                                        {data.inboundToName || t('umrahChecklistScreen.to')}
                                    </Text>
                                    <Text style={styles.chipDropdownArrow}>▼</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Inbound Date Row */}
                            <View style={styles.compactDateRow}>
                                <Text style={styles.compactDateLabel}>{t('umrahChecklistScreen.inbound')}</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={styles.webDateInputWrapper}>
                                        <Text style={[styles.compactDateText, data.inboundDate ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                                            {formatDateForDisplay(data.inboundDate)}
                                        </Text>
                                        <input
                                            type="date"
                                            value={formatDateForInput(data.inboundDate)}
                                            onChange={onInboundDateChangeWeb}
                                            min={formatDateForInput(data.outboundDate || new Date())}
                                            style={webDateInputStyle}
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.dateTouchable}
                                        onPress={() => setShowInboundDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.compactDateText, data.inboundDate ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                                            {formatDateForDisplay(data.inboundDate)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Travel Action Buttons - Show only if dates are selected */}
                        {data.outboundDate && data.inboundDate && (
                            <View style={styles.plannerActions}>
                                <AppButton
                                    variant="outline"
                                    style={styles.plannerActionBtn}
                                    textStyle={styles.plannerActionBtnText}
                                    icon={<Plane size={14} color={theme.primary} />}
                                    title={t('umrahChecklistScreen.flight')}
                                    onPress={openSkyscanner}
                                />
                                <AppButton
                                    variant="outline"
                                    style={styles.plannerActionBtn}
                                    textStyle={styles.plannerActionBtnText}
                                    icon={<Hotel size={14} color={theme.primary} />}
                                    title={t('umrahChecklistScreen.hotel', { city: cityLabel(data.outboundTo) })}
                                    onPress={openFirstCityHotel}
                                />
                                {needsTransfer && data.transferDate && (
                                    <AppButton
                                        variant="outline"
                                        style={styles.plannerActionBtn}
                                        textStyle={styles.plannerActionBtnText}
                                        icon={<Hotel size={14} color={theme.primary} />}
                                        title={t('umrahChecklistScreen.hotel', { city: cityLabel(data.inboundFrom) })}
                                        onPress={openSecondCityHotel}
                                    />
                                )}
                            </View>
                        )}
                    </View>

                    {/* Modals and Pickers */}
                    <Modal visible={showOutboundPicker} transparent animationType="fade" onRequestClose={() => setShowOutboundPicker(false)}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOutboundPicker(false)}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{t('umrahChecklistScreen.whereFrom')}</Text>
                                {TURKISH_CITIES.map((city) => (
                                    <TouchableOpacity key={city.code} style={styles.modalOption} onPress={() => selectOutboundCity(city)}>
                                        <Text style={styles.modalOptionText}>{city.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <Modal visible={showInboundPicker} transparent animationType="fade" onRequestClose={() => setShowInboundPicker(false)}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInboundPicker(false)}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{t('umrahChecklistScreen.whereTo')}</Text>
                                {TURKISH_CITIES.map((city) => (
                                    <TouchableOpacity key={city.code} style={styles.modalOption} onPress={() => selectInboundCity(city)}>
                                        <Text style={styles.modalOptionText}>{city.name}</Text>
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
                        <View style={[styles.compactReminder, { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }]}>
                            <Lightbulb size={14} color={theme.primary} />
                            <Text style={[styles.compactReminderText, styles.reminderTextPrimary]}>
                                {t('umrahChecklistScreen.ihramReminder')}
                            </Text>
                        </View>
                    )}
                </View>


                {/* COMPACT TRANSFER DATE (if needed) */}
                {needsTransfer && (
                    <View style={styles.plannerCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <TrainFront size={16} color={theme.text} />
                            <Text style={[styles.plannerTitle, { marginBottom: 0 }]}>
                                {t('umrahChecklistScreen.cityTransfer')}
                            </Text>
                        </View>
                        <Text style={[styles.compactReminderText, styles.transferDescriptionText]}>
                            {t('umrahChecklistScreen.transferDateDescription', { from: cityLabel(data.outboundTo), to: cityLabel(data.inboundFrom) })}
                        </Text>

                        {/* Compact Date Row for Transfer */}
                        <View style={styles.compactDateRow}>
                            <Text style={styles.compactDateLabel}>{t('umrahChecklistScreen.date')}</Text>
                            {Platform.OS === 'web' ? (
                                <View style={styles.webDateInputWrapper}>
                                    <Text style={[styles.compactDateText, data.transferDate ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                                        {formatDateForDisplay(data.transferDate)}
                                    </Text>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.transferDate)}
                                        onChange={onTransferDateChangeWeb}
                                        min={formatDateForInput(data.outboundDate || new Date())}
                                        max={data.inboundDate ? formatDateForInput(data.inboundDate) : undefined}
                                        style={webDateInputStyle}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.dateTouchable}
                                    onPress={() => setShowTransferDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.compactDateText, data.transferDate ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                                        {formatDateForDisplay(data.transferDate)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Train Button - Show only if transfer date is selected */}
                        {data.transferDate && (
                            <AppButton
                                variant="outline"
                                style={StyleSheet.flatten([styles.plannerActionBtn, styles.plannerActionBtnTall])}
                                textStyle={styles.plannerActionBtnText}
                                icon={<TrainFront size={14} color={theme.primary} />}
                                title={t('umrahChecklistScreen.trainTicket')}
                                onPress={() => openLink('https://sar.hhr.sa/home#/', 'Hızlı Tren')}
                            />
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
                        style={[styles.linkButton, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                        onPress={() => openLink('https://visa.visitsaudi.com/', 'E-Vize')}
                    >
                        <FileText size={16} color={theme.text} />
                        <Text style={styles.linkButtonText}>
                            {t('umrahChecklistScreen.eVisa')}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.nusukCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Landmark size={16} color={theme.text} />
                            <Text style={[styles.nusukTitle, { marginBottom: 0 }]}>
                                {t('umrahChecklistScreen.nusukTitle')}
                            </Text>
                        </View>
                        <Text style={styles.nusukDesc}>
                            {t('umrahChecklistScreen.nusukDescription')}
                        </Text>
                        <View style={styles.appButtonsRow}>
                            <TouchableOpacity
                                style={styles.appButton}
                                onPress={() => openLink('https://play.google.com/store/apps/details?id=com.moh.nusukapp&hl=tr', t('umrahChecklistScreen.nusukGooglePlay'))}
                            >
                                <View style={styles.appButtonContent}>
                                    <Ionicons name="logo-google-playstore" size={18} color={theme.primary} />
                                    <Text style={styles.appButtonText}>{t('umrahChecklistScreen.googlePlay')}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.appButton}
                                onPress={() => openLink('https://apps.apple.com/tr/app/nusuk-%D9%86%D8%B3%D9%83/id6469515422?l=tr', t('umrahChecklistScreen.nusukAppStore'))}
                            >
                                <View style={styles.appButtonContent}>
                                    <Ionicons name="logo-apple-appstore" size={18} color={theme.primary} />
                                    <Text style={styles.appButtonText}>{t('umrahChecklistScreen.appStore')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Checklist Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('umrahChecklistScreen.checklistTitle')}
                    </Text>

                    {CHECKLIST_ITEM_KEYS.map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={styles.checklistItem}
                            onPress={() => toggleChecklistItem(key)}
                        >
                            <View style={[
                                styles.checkbox,
                                data.checklist[key] && styles.checkboxChecked
                            ]}>
                                {data.checklist[key] && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[
                                styles.checklistText,
                                data.checklist[key] && styles.checkedText
                            ]}>
                                {t(`umrahChecklistScreen.items.${key}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};
