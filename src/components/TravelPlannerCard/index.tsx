import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plane, Hotel, TrainFront, ChevronDown, CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { AppButton } from '@/components/AppButton';
import { webDateInputStyle } from '@/components/DateField';
import { CityPickerModal, CityOption } from '@/components/CityPickerModal';
import { HolyCity, UmrahTripData, otherCity, nightsBetween, toIsoDate, fromIsoDate } from '@/utils/umrahTrip';
import { createStyles } from './index.styles';

interface TravelPlannerCardProps {
    trip: UmrahTripData;
    cities: CityOption[];
    onChange: (patch: Partial<UmrahTripData>) => void;
    onOpenFlights: () => void;
    onOpenHotel: (city: HolyCity, checkin: Date, checkout: Date) => void;
    onOpenTrain: () => void;
}

type DotKind = 'endpoint' | 'holy' | 'minor';

/**
 * The trip as a route: home airport → first holy city → (move to the other city) → home.
 * Each stop holds its own date and the booking action that belongs to it.
 */
export const TravelPlannerCard: React.FC<TravelPlannerCardProps> = ({
    trip, cities, onChange, onOpenFlights, onOpenHotel, onOpenTrain,
}) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [cityPicker, setCityPicker] = useState<'from' | 'to' | null>(null);

    const cityLabel = (city: HolyCity) => t(`umrahChecklistScreen.${city === 'Mekke' ? 'mekke' : 'medine'}`);
    const firstCity = trip.outboundTo;
    const secondCity = otherCity(firstCity);
    const hasTransfer = trip.inboundFrom !== firstCity;

    // The first stay ends at the transfer when there is one, otherwise at the flight home
    const firstCheckout = hasTransfer ? trip.transferDate : trip.inboundDate;
    const firstNights = nightsBetween(trip.outboundDate, firstCheckout);
    const secondNights = hasTransfer ? nightsBetween(trip.transferDate, trip.inboundDate) : null;
    const flightsReady = !!(trip.outboundFrom && trip.inboundTo && trip.outboundDate && trip.inboundDate);

    const setFirstCity = (city: HolyCity) => {
        // Keep the "fly home from here / move on" choice when the first city flips
        onChange({ outboundTo: city, inboundFrom: hasTransfer ? otherCity(city) : city });
    };

    const renderStation = (dot: DotKind, last: boolean, children: React.ReactNode) => (
        <View style={styles.station}>
            <View style={styles.rail}>
                <View style={dot === 'holy' ? styles.dotHoly : dot === 'minor' ? styles.dotMinor : styles.dotEndpoint} />
                {!last && <View style={styles.railLine} />}
            </View>
            <View style={[styles.stationBody, last && styles.stationBodyLast]}>{children}</View>
        </View>
    );

    const renderHeader = (label: string, nights?: number | null) => (
        <View style={styles.stationHeader}>
            <Text style={styles.stationLabel}>{label}</Text>
            {nights != null && <Text style={styles.nights}>{t('umrahChecklistScreen.nights', { count: nights })}</Text>}
        </View>
    );

    const renderCityField = (name: string, placeholder: string, which: 'from' | 'to') => (
        <TouchableOpacity
            style={[styles.field, styles.fieldGrow]}
            onPress={() => setCityPicker(which)}
            accessibilityRole="button"
            accessibilityLabel={placeholder}
        >
            <Text style={[styles.fieldText, styles.fieldGrow, !name && styles.fieldPlaceholder]} numberOfLines={1}>
                {name || placeholder}
            </Text>
            <ChevronDown size={16} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    const renderSegmented = (options: { key: string; label: string; active: boolean; onPress: () => void }[]) => (
        <View style={styles.segmented} accessibilityRole="radiogroup">
            {options.map((o) => (
                <TouchableOpacity
                    key={o.key}
                    style={[styles.segment, o.active && styles.segmentActive]}
                    onPress={o.onPress}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: o.active }}
                >
                    <Text style={[styles.segmentText, o.active && styles.segmentTextActive]}>{o.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const hotelButton = (city: HolyCity, checkin: Date | null, checkout: Date | null) =>
        checkin && checkout && checkout > checkin ? (
            <AppButton
                variant="outline"
                size="small"
                style={styles.actionButton}
                icon={<Hotel size={14} color={theme.primary} />}
                title={t('umrahChecklistScreen.searchHotels', { city: cityLabel(city) })}
                onPress={() => onOpenHotel(city, checkin, checkout)}
            />
        ) : null;
    const firstHotel = hotelButton(firstCity, trip.outboundDate, firstCheckout);

    return (
        <View style={styles.card}>
            {renderStation('endpoint', false, (
                <>
                    {renderHeader(t('umrahChecklistScreen.departure'))}
                    <View style={styles.fieldRow}>
                        {renderCityField(trip.outboundFromName, t('umrahChecklistScreen.from'), 'from')}
                        <RouteDate
                            value={trip.outboundDate}
                            min={new Date()}
                            locale={i18n.language}
                            onChange={(d) => onChange({ outboundDate: d })}
                        />
                    </View>
                </>
            ))}

            {renderStation('holy', false, (
                <>
                    {renderHeader(t('umrahChecklistScreen.firstStop'), firstNights)}
                    {renderSegmented((['Mekke', 'Medine'] as HolyCity[]).map((city) => ({
                        key: city,
                        label: cityLabel(city),
                        active: firstCity === city,
                        onPress: () => setFirstCity(city),
                    })))}
                    {firstCity === 'Mekke' && (
                        <Text style={styles.note}>{t('umrahChecklistScreen.ihramReminder')}</Text>
                    )}
                    {firstHotel && <View style={styles.actions}>{firstHotel}</View>}
                </>
            ))}

            {renderStation(hasTransfer ? 'holy' : 'minor', false, (
                <>
                    {renderHeader(t('umrahChecklistScreen.then'), secondNights)}
                    {renderSegmented([
                        {
                            key: 'stay',
                            label: t('umrahChecklistScreen.flyHomeFrom', { city: cityLabel(firstCity) }),
                            active: !hasTransfer,
                            onPress: () => onChange({ inboundFrom: firstCity }),
                        },
                        {
                            key: 'move',
                            label: t('umrahChecklistScreen.moveTo', { city: cityLabel(secondCity) }),
                            active: hasTransfer,
                            onPress: () => onChange({ inboundFrom: secondCity }),
                        },
                    ])}
                    {hasTransfer && (
                        <>
                            <View style={styles.fieldRow}>
                                <Text style={[styles.note, { flex: 1 }]}>
                                    {t('umrahChecklistScreen.transferDay', { from: cityLabel(firstCity), to: cityLabel(secondCity) })}
                                </Text>
                                <RouteDate
                                    value={trip.transferDate}
                                    min={trip.outboundDate ?? new Date()}
                                    max={trip.inboundDate}
                                    locale={i18n.language}
                                    onChange={(d) => onChange({ transferDate: d })}
                                />
                            </View>
                            <View style={styles.actions}>
                                {trip.transferDate && (
                                    <AppButton
                                        variant="outline"
                                        size="small"
                                        style={styles.actionButton}
                                        icon={<TrainFront size={14} color={theme.primary} />}
                                        title={t('umrahChecklistScreen.trainLabel')}
                                        onPress={onOpenTrain}
                                    />
                                )}
                                {hotelButton(secondCity, trip.transferDate, trip.inboundDate)}
                            </View>
                        </>
                    )}
                </>
            ))}

            {renderStation('endpoint', true, (
                <>
                    {renderHeader(t('umrahChecklistScreen.returnHome'))}
                    <View style={styles.fieldRow}>
                        {renderCityField(trip.inboundToName, t('umrahChecklistScreen.to'), 'to')}
                        <RouteDate
                            value={trip.inboundDate}
                            min={trip.transferDate ?? trip.outboundDate ?? new Date()}
                            locale={i18n.language}
                            onChange={(d) => onChange({ inboundDate: d })}
                        />
                    </View>
                </>
            ))}

            <View style={styles.footer}>
                <AppButton
                    variant="primary"
                    style={styles.flightButton}
                    icon={<Plane size={16} color="#FFFFFF" />}
                    title={t('umrahChecklistScreen.searchFlights')}
                    disabled={!flightsReady}
                    onPress={onOpenFlights}
                />
                {!flightsReady && <Text style={styles.footerHint}>{t('umrahChecklistScreen.flightsHint')}</Text>}
            </View>

            <CityPickerModal
                visible={cityPicker === 'from'}
                title={t('umrahChecklistScreen.whereFrom')}
                cities={cities}
                onSelect={(c) => { onChange({ outboundFrom: c.code, outboundFromName: c.name }); setCityPicker(null); }}
                onClose={() => setCityPicker(null)}
            />
            <CityPickerModal
                visible={cityPicker === 'to'}
                title={t('umrahChecklistScreen.whereTo')}
                cities={cities}
                onSelect={(c) => { onChange({ inboundTo: c.code, inboundToName: c.name }); setCityPicker(null); }}
                onClose={() => setCityPicker(null)}
            />
        </View>
    );
};

interface RouteDateProps {
    value: Date | null;
    min?: Date | null;
    max?: Date | null;
    locale: string;
    onChange: (date: Date) => void;
}

/** A date shown as "10 Ara 2026"; opens the native picker, or an invisible <input type="date"> on web */
const RouteDate: React.FC<RouteDateProps> = ({ value, min, max, locale, onChange }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [open, setOpen] = useState(false);

    const label = value
        ? value.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
        : t('umrahChecklistScreen.selectDate');

    const content = (
        <>
            <CalendarDays size={15} color={value ? theme.iconPrimary : theme.textSecondary} />
            <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>{label}</Text>
        </>
    );

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.field, styles.webDateWrapper]}>
                {content}
                <input
                    type="date"
                    aria-label={t('umrahChecklistScreen.selectDate')}
                    value={toIsoDate(value)}
                    min={min ? toIsoDate(min) : undefined}
                    max={max ? toIsoDate(max) : undefined}
                    onChange={(e) => {
                        const d = fromIsoDate(e.target.value);
                        if (d) onChange(d);
                    }}
                    style={webDateInputStyle}
                />
            </View>
        );
    }

    return (
        <>
            <TouchableOpacity style={styles.field} onPress={() => setOpen(true)} accessibilityRole="button">
                {content}
            </TouchableOpacity>
            {open && (
                <DateTimePicker
                    value={value ?? min ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={min ?? undefined}
                    maximumDate={max ?? undefined}
                    onChange={(event: any, d?: Date) => {
                        if (Platform.OS === 'android') setOpen(false);
                        if (d && event.type !== 'dismissed') onChange(d);
                    }}
                />
            )}
        </>
    );
};
