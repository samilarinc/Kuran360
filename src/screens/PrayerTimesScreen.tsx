import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { SPACING, FONT_SIZES } from '../theme';
import { PrayerTime } from '../types';
import locations from '../data/locations.json';
import { createStyles } from './PrayerTimesScreen.styles';

interface Location {
    id: string;
    cityName: string;
    districtName: string | null;
    fileName: string;
}

export const PrayerTimesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { settings, updateSettings } = useSettings();
    const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayTimes, setTodayTimes] = useState<PrayerTime | null>(null);
    const [nextPrayer, setNextPrayer] = useState<{ label: string, time: string, remaining: string } | null>(null);
    const [currentPrayerLabel, setCurrentPrayerLabel] = useState<string | null>(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load prayer times and start timer for next prayer
    useEffect(() => {
        loadPrayerTimes();
        const timer = setInterval(updatePrayerStatus, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [settings.prayerLocation?.id, todayTimes]);

    const loadPrayerTimes = async () => {
        const locationId = settings.prayerLocation?.id || '9541'; // Default to Istanbul
        const selectedLocation = (locations as Location[]).find(l => l.id === locationId);

        if (!selectedLocation) return;

        setLoading(true);
        try {
            const baseUrl = Platform.OS === 'web' ? '' : 'https://kuran360.com';
            const response = await fetch(`${baseUrl}/2025_ezan/${selectedLocation.fileName}`);
            const data = await response.json();
            setPrayerTimes(data);

            // Find today's times
            // Note: The date_index in JSON seems to be day of year (1-365)
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);

            const today = data.find((t: PrayerTime) => t.date_index === dayOfYear);
            setTodayTimes(today || data[0]);
            updatePrayerStatus(today || data[0]);
        } catch (error) {
            console.error('Error loading prayer times:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseGPS = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Reddedildi', 'Konumunuza erişmek için izin vermeniz gerekmektedir.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            console.log('Current location:', location);

            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            console.log('Expo Reverse geocode:', reverseGeocode);

            // Fallback for Web/SDK 49+ where Expo's reverseGeocode might return empty
            if (reverseGeocode.length === 0 || (!reverseGeocode[0].city && !reverseGeocode[0].district)) {
                console.log('Using Nominatim fallback for reverse geocoding...');
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&addressdetails=1`,
                        { headers: { 'Accept-Language': 'tr' } }
                    );
                    const data = await response.json();
                    if (data && data.address) {
                        reverseGeocode = [{
                            city: data.address.province || data.address.city || data.address.town,
                            district: data.address.district || data.address.suburb || data.address.borough || data.address.city_district,
                            region: data.address.region,
                            subregion: data.address.county,
                            street: data.address.road,
                            streetNumber: data.address.house_number,
                            postalCode: data.address.postcode,
                            name: data.display_name,
                            isoCountryCode: data.address.country_code?.toUpperCase(),
                            country: data.address.country,
                            timezone: null,
                            formattedAddress: data.display_name
                        } as Location.LocationGeocodedAddress];
                        console.log('Nominatim result:', reverseGeocode[0]);
                    }
                } catch (err) {
                    console.error('Nominatim fallback failed:', err);
                }
            }

            if (reverseGeocode.length > 0) {
                const { city, district, subregion, region, name } = reverseGeocode[0];
                console.log('Detected location components:', { city, district, subregion, region, name });

                const searchTerms = [
                    district,
                    subregion,
                    city,
                    region,
                    // Extract possible city/district from name if others are missing
                    ...(name ? name.split(',').map(s => s.trim()) : [])
                ].filter(Boolean) as string[];

                let bestMatch: any = null;
                const locs = locations as Location[];

                // Phase 1: Exact match on district or city
                for (const term of searchTerms) {
                    const normalizedTerm = term.toLowerCase();
                    bestMatch = locs.find(l =>
                        l.districtName?.toLowerCase() === normalizedTerm ||
                        (l.cityName.toLowerCase() === normalizedTerm && !l.districtName)
                    );
                    if (bestMatch) break;
                }

                // Phase 2: Fuzzy match if exact failed
                if (!bestMatch) {
                    for (const term of searchTerms) {
                        const normalizedTerm = term.toLowerCase();
                        bestMatch = locs.find(l =>
                            (l.districtName && normalizedTerm.includes(l.districtName.toLowerCase())) ||
                            normalizedTerm.includes(l.cityName.toLowerCase())
                        );
                        if (bestMatch) break;
                    }
                }

                if (bestMatch) {
                    handleSelectLocation(bestMatch);
                } else {
                    Alert.alert(
                        'Konum Bulunamadı',
                        `Tespit edilen konum (${searchTerms[0] || 'Bilinmiyor'}) için uygun bir vakit dosyası bulunamadı. Lütfen listeden manuel seçiniz.`,
                        [{ text: 'Tamam' }]
                    );
                }
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Hata', 'Konum bilgisi alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    const updatePrayerStatus = (times: PrayerTime | null = todayTimes) => {
        if (!times) return;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const prayerSchedule = [
            { label: 'İmsak', time: times.imsak },
            { label: 'Güneş', time: times.gunes },
            { label: 'Öğle', time: times.ogle },
            { label: 'İkindi', time: times.ikindi },
            { label: 'Akşam', time: times.aksam },
            { label: 'Yatsı', time: times.yatsi },
        ];

        let current = 'Yatsı';
        let nextIndex = 0;

        for (let i = 0; i < prayerSchedule.length; i++) {
            const time = parseTime(prayerSchedule[i].time);
            if (currentTime < time) {
                nextIndex = i;
                current = i === 0 ? 'Yatsı' : prayerSchedule[i - 1].label;
                break;
            }
            if (i === prayerSchedule.length - 1) {
                nextIndex = 0; // Next is tomorrow's Imsak
                current = 'Yatsı';
            }
        }

        setCurrentPrayerLabel(current);

        const next = prayerSchedule[nextIndex];
        let nextTimeMinutes = parseTime(next.time);

        if (nextIndex === 0 && currentTime >= parseTime(prayerSchedule[prayerSchedule.length - 1].time)) {
            nextTimeMinutes += 24 * 60; // Tomorrow's Imsak
        }

        const diffMinutes = nextTimeMinutes - currentTime;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;

        setNextPrayer({
            label: next.label,
            time: next.time,
            remaining: `${hours > 0 ? `${hours} sa ` : ''}${mins} dk`
        });
    };

    const handleSelectLocation = (location: Location) => {
        updateSettings({
            prayerLocation: {
                id: location.id,
                cityName: location.cityName,
                districtName: location.districtName || null,
            }
        });
        setShowLocationPicker(false);
    };

    const filteredLocations = useMemo(() => {
        if (!searchQuery) return (locations as Location[]).slice(0, 50);
        const query = searchQuery.toLowerCase();
        return (locations as Location[]).filter(l =>
            l.cityName.toLowerCase().includes(query) ||
            (l.districtName && l.districtName.toLowerCase().includes(query))
        ).slice(0, 50);
    }, [searchQuery]);

    const renderTimeRow = (label: string, time: string, icon: string) => {
        const isCurrent = currentPrayerLabel === label;
        return (
            <View style={[
                styles.timeRow,
                { borderBottomColor: theme.border },
                isCurrent && [styles.currentTimeRow, { backgroundColor: theme.primary + '15', borderLeftColor: theme.primary }]
            ]}>
                <View style={styles.timeLabelContainer}>
                    <Ionicons name={icon as any} size={24} color={isCurrent ? theme.primary : theme.textSecondary} />
                    <Text style={[
                        styles.timeLabel,
                        { color: theme.textSecondary },
                        isCurrent && [styles.currentTimeLabel, { color: theme.primary }]
                    ]}>{label}</Text>
                </View>
                <Text style={[
                    styles.timeValue,
                    { color: theme.text },
                    isCurrent && [styles.currentTimeValue, { color: theme.primary }]
                ]}>{time}</Text>
            </View>
        );
    };

    if (loading && !todayTimes) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title="Ezan Vakitleri"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.currentLocationCard, { backgroundColor: theme.primary }]}>
                    <View style={styles.locationHeaderRow}>
                        <Text style={[styles.locationName, { color: theme.headerText }]}>
                            {settings.prayerLocation?.cityName}
                            {settings.prayerLocation?.districtName ? `, ${settings.prayerLocation.districtName}` : ''}
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => setShowLocationPicker(true)}
                                style={[styles.gpsButton, { marginRight: 8, backgroundColor: 'rgba(255,255,255,0.2)' }]}
                            >
                                <Ionicons name="search" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUseGPS} style={styles.gpsButton}>
                                <Ionicons name="locate" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={[styles.dateText, { color: 'rgba(255,255,255,0.9)' }]}>{todayTimes?.miladi}</Text>
                    <Text style={[styles.hicriText, { color: 'rgba(255,255,255,0.7)' }]}>{todayTimes?.hicri}</Text>
                </View>

                <View style={[styles.timesCard, { backgroundColor: theme.cardBackground }]}>
                    {nextPrayer && (
                        <View style={[styles.nextPrayerInfo, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.nextPrayerLabel, { color: theme.textSecondary }]}>{nextPrayer.label} vaktine kalan süre</Text>
                            <Text style={[styles.remainingTime, { color: theme.primary }]}>{nextPrayer.remaining}</Text>
                        </View>
                    )}
                    {todayTimes && (
                        <>
                            {renderTimeRow('İmsak', todayTimes.imsak, 'sunny-outline')}
                            {renderTimeRow('Güneş', todayTimes.gunes, 'sunny')}
                            {renderTimeRow('Öğle', todayTimes.ogle, 'partly-sunny')}
                            {renderTimeRow('İkindi', todayTimes.ikindi, 'cloudy-night-outline')}
                            {renderTimeRow('Akşam', todayTimes.aksam, 'moon-outline')}
                            {renderTimeRow('Yatsı', todayTimes.yatsi, 'moon')}
                        </>
                    )}
                </View>

                {/* Optional: Add a next prayer countdown or highlight current prayer */}
            </ScrollView>

            {showLocationPicker && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Konum Seç</Text>
                            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                            <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Şehir veya ilçe ara..."
                                placeholderTextColor={theme.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <ScrollView style={styles.locationList}>
                            {filteredLocations.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[styles.locationItem, { borderBottomColor: theme.border }]}
                                    onPress={() => handleSelectLocation(loc)}
                                >
                                    <Text style={[styles.locationItemText, { color: theme.text }]}>
                                        {loc.cityName}{loc.districtName ? ` - ${loc.districtName}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
};


