import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plane, Hotel, Lightbulb } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { AppButton } from '@/components/AppButton';
import { DateField } from '@/components/DateField';
import { CityPickerModal, CityOption } from '@/components/CityPickerModal';
import { createStyles as createChromeStyles } from '../TravelCardChrome.styles';
import { createStyles } from './index.styles';

type City = 'Mekke' | 'Medine';

interface TravelPlannerCardProps {
    outboundFromName: string;
    outboundTo: City;
    outboundDate: Date | null;
    inboundFrom: City;
    inboundToName: string;
    inboundDate: Date | null;
    transferDate: Date | null;
    needsTransfer: boolean;
    showIhramReminder: boolean;
    cities: CityOption[];
    cityLabel: (city: City) => string;
    formatDateForDisplay: (date: Date | null) => string;
    formatDateForInput: (date: Date | null) => string;
    showOutboundPicker: boolean;
    showInboundPicker: boolean;
    showOutboundDatePicker: boolean;
    showInboundDatePicker: boolean;
    onOutboundCityPress: () => void;
    onOutboundToChange: (city: City) => void;
    onInboundFromChange: (city: City) => void;
    onInboundCityPress: () => void;
    onOutboundDateChangeWeb: (event: any) => void;
    onInboundDateChangeWeb: (event: any) => void;
    onRequestOutboundDatePicker: () => void;
    onRequestInboundDatePicker: () => void;
    onOutboundDateChange: (event: any, date?: Date) => void;
    onInboundDateChange: (event: any, date?: Date) => void;
    onSelectOutboundCity: (city: CityOption) => void;
    onSelectInboundCity: (city: CityOption) => void;
    onCloseOutboundPicker: () => void;
    onCloseInboundPicker: () => void;
    onOpenSkyscanner: () => void;
    onOpenFirstCityHotel: () => void;
    onOpenSecondCityHotel: () => void;
}

export const TravelPlannerCard: React.FC<TravelPlannerCardProps> = (props) => {
    const {
        outboundFromName, outboundTo, outboundDate,
        inboundFrom, inboundToName, inboundDate,
        transferDate, needsTransfer, showIhramReminder,
        cities, cityLabel, formatDateForDisplay, formatDateForInput,
        showOutboundPicker, showInboundPicker, showOutboundDatePicker, showInboundDatePicker,
        onOutboundCityPress, onOutboundToChange, onInboundFromChange, onInboundCityPress,
        onOutboundDateChangeWeb, onInboundDateChangeWeb,
        onRequestOutboundDatePicker, onRequestInboundDatePicker,
        onOutboundDateChange, onInboundDateChange,
        onSelectOutboundCity, onSelectInboundCity,
        onCloseOutboundPicker, onCloseInboundPicker,
        onOpenSkyscanner, onOpenFirstCityHotel, onOpenSecondCityHotel,
    } = props;

    const { theme } = useTheme();
    const { t } = useTranslation();
    const chrome = useMemo(() => createChromeStyles(theme), [theme]);
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={chrome.plannerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Plane size={16} color={theme.text} />
                <Text style={[chrome.plannerTitle, { marginBottom: 0 }]}>
                    {t('umrahChecklistScreen.travelPlan')}
                </Text>
            </View>

            {/* Outbound Row */}
            <View style={styles.compactTripRow}>
                <View style={styles.compactTripMain}>
                    <View style={styles.compactCitySelect}>
                        <TouchableOpacity style={styles.cityChip} onPress={onOutboundCityPress}>
                            <Text style={[styles.cityChipText, outboundFromName ? styles.cityChipTextFilled : styles.cityChipTextPlaceholder]}>
                                {outboundFromName || t('umrahChecklistScreen.from')}
                            </Text>
                            <Text style={styles.chipDropdownArrow}>▼</Text>
                        </TouchableOpacity>

                        <Text style={styles.tripArrow}>➔</Text>

                        <View style={styles.destinationChips}>
                            <TouchableOpacity
                                style={[styles.destinationChip, outboundTo === 'Mekke' && styles.destinationChipActive]}
                                onPress={() => onOutboundToChange('Mekke')}
                            >
                                <Text style={[styles.destinationChipText, outboundTo === 'Mekke' && styles.destinationChipTextActive]}>{cityLabel('Mekke')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.destinationChip, outboundTo === 'Medine' && styles.destinationChipActive]}
                                onPress={() => onOutboundToChange('Medine')}
                            >
                                <Text style={[styles.destinationChipText, outboundTo === 'Medine' && styles.destinationChipTextActive]}>{cityLabel('Medine')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <DateField
                        label={t('umrahChecklistScreen.outbound')}
                        displayText={formatDateForDisplay(outboundDate)}
                        isFilled={!!outboundDate}
                        inputValue={formatDateForInput(outboundDate)}
                        minInput={formatDateForInput(new Date())}
                        onChangeWeb={onOutboundDateChangeWeb}
                        onPress={onRequestOutboundDatePicker}
                    />
                </View>
            </View>

            <View style={styles.plannerDivider} />

            {/* Inbound Row */}
            <View style={styles.compactTripRow}>
                <View style={styles.compactTripMain}>
                    <View style={styles.compactCitySelect}>
                        <View style={styles.destinationChips}>
                            <TouchableOpacity
                                style={[styles.destinationChip, inboundFrom === 'Mekke' && styles.destinationChipActive]}
                                onPress={() => onInboundFromChange('Mekke')}
                            >
                                <Text style={[styles.destinationChipText, inboundFrom === 'Mekke' && styles.destinationChipTextActive]}>{cityLabel('Mekke')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.destinationChip, inboundFrom === 'Medine' && styles.destinationChipActive]}
                                onPress={() => onInboundFromChange('Medine')}
                            >
                                <Text style={[styles.destinationChipText, inboundFrom === 'Medine' && styles.destinationChipTextActive]}>{cityLabel('Medine')}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.tripArrow}>➔</Text>

                        <TouchableOpacity style={styles.cityChip} onPress={onInboundCityPress}>
                            <Text style={[styles.cityChipText, inboundToName ? styles.cityChipTextFilled : styles.cityChipTextPlaceholder]}>
                                {inboundToName || t('umrahChecklistScreen.to')}
                            </Text>
                            <Text style={styles.chipDropdownArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    <DateField
                        label={t('umrahChecklistScreen.inbound')}
                        displayText={formatDateForDisplay(inboundDate)}
                        isFilled={!!inboundDate}
                        inputValue={formatDateForInput(inboundDate)}
                        minInput={formatDateForInput(outboundDate || new Date())}
                        onChangeWeb={onInboundDateChangeWeb}
                        onPress={onRequestInboundDatePicker}
                    />
                </View>

                {/* Travel Action Buttons - Show only if dates are selected */}
                {outboundDate && inboundDate && (
                    <View style={chrome.plannerActions}>
                        <AppButton
                            variant="outline"
                            style={chrome.plannerActionBtn}
                            textStyle={chrome.plannerActionBtnText}
                            icon={<Plane size={14} color={theme.primary} />}
                            title={t('umrahChecklistScreen.flight')}
                            onPress={onOpenSkyscanner}
                        />
                        <AppButton
                            variant="outline"
                            style={chrome.plannerActionBtn}
                            textStyle={chrome.plannerActionBtnText}
                            icon={<Hotel size={14} color={theme.primary} />}
                            title={t('umrahChecklistScreen.hotel', { city: cityLabel(outboundTo) })}
                            onPress={onOpenFirstCityHotel}
                        />
                        {needsTransfer && transferDate && (
                            <AppButton
                                variant="outline"
                                style={chrome.plannerActionBtn}
                                textStyle={chrome.plannerActionBtnText}
                                icon={<Hotel size={14} color={theme.primary} />}
                                title={t('umrahChecklistScreen.hotel', { city: cityLabel(inboundFrom) })}
                                onPress={onOpenSecondCityHotel}
                            />
                        )}
                    </View>
                )}
            </View>

            <CityPickerModal
                visible={showOutboundPicker}
                title={t('umrahChecklistScreen.whereFrom')}
                cities={cities}
                onSelect={onSelectOutboundCity}
                onClose={onCloseOutboundPicker}
            />

            <CityPickerModal
                visible={showInboundPicker}
                title={t('umrahChecklistScreen.whereTo')}
                cities={cities}
                onSelect={onSelectInboundCity}
                onClose={onCloseInboundPicker}
            />

            {Platform.OS !== 'web' && showOutboundDatePicker && (
                <DateTimePicker value={outboundDate || new Date()} mode="date" display="default" onChange={onOutboundDateChange} minimumDate={new Date()} />
            )}
            {Platform.OS !== 'web' && showInboundDatePicker && (
                <DateTimePicker value={inboundDate || new Date()} mode="date" display="default" onChange={onInboundDateChange} minimumDate={outboundDate || new Date()} />
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
    );
};
