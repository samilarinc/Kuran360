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
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { SPACING, FONT_SIZES } from '../theme';

interface ChecklistData {
    // Outbound (Gidiş)
    outboundFrom: string; // Turkey city code
    outboundFromName: string;
    outboundTo: 'Mekke' | 'Medine';
    outboundDate: Date | null;
    
    // Inbound (Dönüş)
    inboundFrom: 'Mekke' | 'Medine';
    inboundTo: string; // Turkey city code
    inboundToName: string;
    inboundDate: Date | null;
    
    // Transfer (only if outboundTo !== inboundFrom)
    transferDate: Date | null;
    
    // Checklist items
    ticketPurchased: boolean;
    visaObtained: boolean;
    ihramReady: boolean;
    clothesReady: boolean;
}

type CityOption = {
    name: string;
    code: string;
};

const TURKISH_CITIES: CityOption[] = [
    { name: 'Ankara', code: 'esb' },
    { name: 'İstanbul (Yeni Havalimanı)', code: 'ist' },
    { name: 'İstanbul Sabiha Gökçen', code: 'saw' },
    { name: 'Kayseri', code: 'asr' },
];

const STORAGE_KEY = '@umrah_checklist';

export const UmrahChecklistScreen: React.FC = () => {
    const { theme } = useTheme();
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
        ticketPurchased: false,
        visaObtained: false,
        ihramReady: false,
        clothesReady: false,
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
                // Convert date strings back to Date objects
                setData({
                    ...parsed,
                    outboundDate: parsed.outboundDate ? new Date(parsed.outboundDate) : null,
                    inboundDate: parsed.inboundDate ? new Date(parsed.inboundDate) : null,
                    transferDate: parsed.transferDate ? new Date(parsed.transferDate) : null,
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

    const toggleChecklistItem = (field: 'ticketPurchased' | 'visaObtained' | 'ihramReady' | 'clothesReady') => {
        updateField(field, !data[field]);
    };

    const openLink = async (url: string, label: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Hata', `${label} açılamadı`);
            }
        } catch (error) {
            Alert.alert('Hata', `Bağlantı açılırken bir hata oluştu`);
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

    const formatDateForDisplay = (date: Date | null): string => {
        if (!date) return 'Tarih seçin';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
    };

    const buildSkyscannerUrl = (): string | null => {
        const outboundCode = data.outboundFrom;
        const inboundCode = data.inboundTo;
        
        // Determine Saudi Arabia codes
        const outboundSaudiCode = data.outboundTo === 'Mekke' ? 'jed' : 'med';
        const inboundSaudiCode = data.inboundFrom === 'Mekke' ? 'jed' : 'med';

        // Check if we have the minimum required data
        if (!outboundCode || !inboundCode || !data.outboundDate || !data.inboundDate) {
            return null;
        }

        const outboundDate = formatDateForSkyscanner(data.outboundDate);
        const inboundDate = formatDateForSkyscanner(data.inboundDate);

        // URL: Turkey -> Saudi Arabia (outbound), Saudi Arabia -> Turkey (return)
        return `https://www.skyscanner.com.tr/tasima/ucak-bileti/${outboundCode}/${outboundSaudiCode}/${outboundDate}/${inboundDate}/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
    };

    const openSkyscanner = () => {
        const url = buildSkyscannerUrl();
        if (url) {
            openLink(url, 'Skyscanner');
        } else {
            Alert.alert(
                'Eksik Bilgi',
                'Skyscanner araması için çıkış/dönüş şehri ve tarihlerini doldurmalısınız.'
            );
        }
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader 
                title="Umre Hazırlık Listesi" 
                showBackButton={true}
                onBackPress={() => {}}
            />
            <ScrollView style={styles.content}>
                {/* OUTBOUND (GİDİŞ) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        ✈️ Gidiş
                    </Text>

                    <View style={styles.tripRow}>
                        {/* From City */}
                        <View style={styles.tripColumn}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Nereden</Text>
                            <TouchableOpacity
                                style={[styles.pickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setShowOutboundPicker(!showOutboundPicker)}
                            >
                                <Text style={[styles.pickerButtonText, { color: data.outboundFromName ? theme.text : theme.textSecondary }]}>
                                    {data.outboundFromName || 'Şehir seçin'}
                                </Text>
                                <Text style={[styles.pickerArrow, { color: theme.textSecondary }]}>▼</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>

                        {/* To Destination */}
                        <View style={styles.tripColumn}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Nereye</Text>
                            <View style={styles.destinationButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.destinationButtonSmall,
                                        { borderColor: theme.border },
                                        data.outboundTo === 'Mekke' && { backgroundColor: theme.primary }
                                    ]}
                                    onPress={() => updateField('outboundTo', 'Mekke')}
                                >
                                    <Text style={[
                                        styles.destinationButtonTextSmall,
                                        { color: data.outboundTo === 'Mekke' ? '#FFFFFF' : theme.text }
                                    ]}>
                                        Mekke
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.destinationButtonSmall,
                                        { borderColor: theme.border },
                                        data.outboundTo === 'Medine' && { backgroundColor: theme.primary }
                                    ]}
                                    onPress={() => updateField('outboundTo', 'Medine')}
                                >
                                    <Text style={[
                                        styles.destinationButtonTextSmall,
                                        { color: data.outboundTo === 'Medine' ? '#FFFFFF' : theme.text }
                                    ]}>
                                        Medine
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Modal
                        visible={showOutboundPicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowOutboundPicker(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowOutboundPicker(false)}
                        >
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Çıkış Şehri Seçin</Text>
                                {TURKISH_CITIES.map((city) => (
                                    <TouchableOpacity
                                        key={city.code}
                                        style={[styles.modalOption, { borderBottomColor: theme.border }]}
                                        onPress={() => selectOutboundCity(city)}
                                    >
                                        <Text style={[styles.modalOptionText, { color: theme.text }]}>
                                            {city.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Departure Date */}
                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: SPACING.md }]}>Gidiş Tarihi</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={formatDateForInput(data.outboundDate)}
                            onChange={onOutboundDateChangeWeb}
                            min={formatDateForInput(new Date())}
                            style={{
                                width: '100%',
                                padding: SPACING.md,
                                fontSize: FONT_SIZES.medium,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: theme.border,
                                backgroundColor: theme.surface,
                                color: theme.text,
                            }}
                        />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setShowOutboundDatePicker(true)}
                            >
                                <Text style={[styles.dateButtonText, { color: data.outboundDate ? theme.text : theme.textSecondary }]}>
                                    {formatDateForDisplay(data.outboundDate)}
                                </Text>
                                <Text style={{ fontSize: 20 }}>📅</Text>
                            </TouchableOpacity>

                            {showOutboundDatePicker && (
                                <DateTimePicker
                                    value={data.outboundDate || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onOutboundDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </>
                    )}

                    {showIhramReminder && (
                        <View style={[styles.reminder, { backgroundColor: '#FFF3CD', borderColor: '#FFE69C' }]}>
                            <Text style={[styles.reminderText, { color: '#856404' }]}>
                                ⚠️ İlk durağınız Mekke olduğu için havalimanında ihrama girmeyi unutmayın!
                            </Text>
                        </View>
                    )}
                </View>

                {/* INBOUND (DÖNÜŞ) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        🏠 Dönüş
                    </Text>

                    <View style={styles.tripRow}>
                        {/* From Destination */}
                        <View style={styles.tripColumn}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Nereden</Text>
                            <View style={styles.destinationButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.destinationButtonSmall,
                                        { borderColor: theme.border },
                                        data.inboundFrom === 'Mekke' && { backgroundColor: theme.primary }
                                    ]}
                                    onPress={() => updateField('inboundFrom', 'Mekke')}
                                >
                                    <Text style={[
                                        styles.destinationButtonTextSmall,
                                        { color: data.inboundFrom === 'Mekke' ? '#FFFFFF' : theme.text }
                                    ]}>
                                        Mekke
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.destinationButtonSmall,
                                        { borderColor: theme.border },
                                        data.inboundFrom === 'Medine' && { backgroundColor: theme.primary }
                                    ]}
                                    onPress={() => updateField('inboundFrom', 'Medine')}
                                >
                                    <Text style={[
                                        styles.destinationButtonTextSmall,
                                        { color: data.inboundFrom === 'Medine' ? '#FFFFFF' : theme.text }
                                    ]}>
                                        Medine
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>

                        {/* To City */}
                        <View style={styles.tripColumn}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Nereye</Text>
                            <TouchableOpacity
                                style={[styles.pickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setShowInboundPicker(!showInboundPicker)}
                            >
                                <Text style={[styles.pickerButtonText, { color: data.inboundToName ? theme.text : theme.textSecondary }]}>
                                    {data.inboundToName || 'Şehir seçin'}
                                </Text>
                                <Text style={[styles.pickerArrow, { color: theme.textSecondary }]}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Modal
                        visible={showInboundPicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowInboundPicker(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowInboundPicker(false)}
                        >
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Dönüş Şehri Seçin</Text>
                                {TURKISH_CITIES.map((city) => (
                                    <TouchableOpacity
                                        key={city.code}
                                        style={[styles.modalOption, { borderBottomColor: theme.border }]}
                                        onPress={() => selectInboundCity(city)}
                                    >
                                        <Text style={[styles.modalOptionText, { color: theme.text }]}>
                                            {city.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Return Date */}
                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: SPACING.md }]}>Dönüş Tarihi</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={formatDateForInput(data.inboundDate)}
                            onChange={onInboundDateChangeWeb}
                            min={formatDateForInput(data.outboundDate || new Date())}
                            style={{
                                width: '100%',
                                padding: SPACING.md,
                                fontSize: FONT_SIZES.medium,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: theme.border,
                                backgroundColor: theme.surface,
                                color: theme.text,
                            }}
                        />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setShowInboundDatePicker(true)}
                            >
                                <Text style={[styles.dateButtonText, { color: data.inboundDate ? theme.text : theme.textSecondary }]}>
                                    {formatDateForDisplay(data.inboundDate)}
                                </Text>
                                <Text style={{ fontSize: 20 }}>📅</Text>
                            </TouchableOpacity>

                            {showInboundDatePicker && (
                                <DateTimePicker
                                    value={data.inboundDate || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onInboundDateChange}
                                    minimumDate={data.outboundDate || new Date()}
                                />
                            )}
                        </>
                    )}
                </View>

                {/* TRANSFER DATE (if needed) */}
                {needsTransfer && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            🚄 Şehirlerarası Geçiş
                        </Text>
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            {data.outboundTo} → {data.inboundFrom} arası geçiş tarihi
                        </Text>
                        {Platform.OS === 'web' ? (
                            <input
                                type="date"
                                value={formatDateForInput(data.transferDate)}
                                onChange={onTransferDateChangeWeb}
                                min={formatDateForInput(data.outboundDate || new Date())}
                                max={data.inboundDate ? formatDateForInput(data.inboundDate) : undefined}
                                style={{
                                    width: '100%',
                                    padding: SPACING.md,
                                    fontSize: FONT_SIZES.medium,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    backgroundColor: theme.surface,
                                    color: theme.text,
                                }}
                            />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                    onPress={() => setShowTransferDatePicker(true)}
                                >
                                    <Text style={[styles.dateButtonText, { color: data.transferDate ? theme.text : theme.textSecondary }]}>
                                        {formatDateForDisplay(data.transferDate)}
                                    </Text>
                                    <Text style={{ fontSize: 20 }}>📅</Text>
                                </TouchableOpacity>

                                {showTransferDatePicker && (
                                    <DateTimePicker
                                        value={data.transferDate || data.outboundDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onTransferDateChange}
                                        minimumDate={data.outboundDate || new Date()}
                                        maximumDate={data.inboundDate || undefined}
                                    />
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* External Links Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Faydalı Bağlantılar
                    </Text>

                    <TouchableOpacity
                        style={[styles.linkButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={openSkyscanner}
                    >
                        <Text style={[styles.linkButtonText, { color: theme.text }]}>
                            ✈️ Skyscanner - Uçak Bileti
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.linkButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openLink('https://visa.mofa.gov.sa/', 'E-Vize')}
                    >
                        <Text style={[styles.linkButtonText, { color: theme.text }]}>
                            📄 Suudi Arabistan E-Vize
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.linkButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openLink('https://www.booking.com/', 'Booking.com')}
                    >
                        <Text style={[styles.linkButtonText, { color: theme.text }]}>
                            🏨 Booking.com - Otel Rezervasyonu
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.linkButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openLink('https://www.sar.com.sa/en', 'Hızlı Tren')}
                    >
                        <Text style={[styles.linkButtonText, { color: theme.text }]}>
                            🚄 Haramain Hızlı Tren (Mekke-Medine)
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.appLinks}>
                        <Text style={[styles.appLinksTitle, { color: theme.textSecondary }]}>
                            Nusuk Uygulaması:
                        </Text>
                        <View style={styles.appButtonsRow}>
                            <TouchableOpacity
                                style={[styles.appButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => openLink('https://play.google.com/store/apps/details?id=sa.nusuk.app', 'Nusuk - Google Play')}
                            >
                                <Text style={[styles.appButtonText, { color: theme.text }]}>
                                    Google Play
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.appButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => openLink('https://apps.apple.com/us/app/nusuk/id1519766399', 'Nusuk - App Store')}
                            >
                                <Text style={[styles.appButtonText, { color: theme.text }]}>
                                    App Store
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Checklist Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Yapılacaklar Listesi
                    </Text>

                    <TouchableOpacity
                        style={[styles.checklistItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => toggleChecklistItem('ticketPurchased')}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            data.ticketPurchased && { backgroundColor: theme.primary }
                        ]}>
                            {data.ticketPurchased && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[
                            styles.checklistText,
                            { color: theme.text },
                            data.ticketPurchased && styles.checkedText
                        ]}>
                            Uçak bileti aldım
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.checklistItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => toggleChecklistItem('visaObtained')}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            data.visaObtained && { backgroundColor: theme.primary }
                        ]}>
                            {data.visaObtained && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[
                            styles.checklistText,
                            { color: theme.text },
                            data.visaObtained && styles.checkedText
                        ]}>
                            Vize aldım
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.checklistItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => toggleChecklistItem('ihramReady')}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            data.ihramReady && { backgroundColor: theme.primary }
                        ]}>
                            {data.ihramReady && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[
                            styles.checklistText,
                            { color: theme.text },
                            data.ihramReady && styles.checkedText
                        ]}>
                            İhram hazır
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.checklistItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => toggleChecklistItem('clothesReady')}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            data.clothesReady && { backgroundColor: theme.primary }
                        ]}>
                            {data.clothesReady && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[
                            styles.checklistText,
                            { color: theme.text },
                            data.clothesReady && styles.checkedText
                        ]}>
                            Kıyafetlerim hazır
                        </Text>
                    </TouchableOpacity>
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
    tripRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    tripColumn: {
        flex: 1,
    },
    arrow: {
        fontSize: 24,
        marginTop: 20,
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
    appButtonsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    appButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    appButtonText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
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
