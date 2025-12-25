import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import { PrayerTime } from '../types';
import locations from '../data/locations.json';

interface Location {
    id: string;
    cityName: string;
    districtName: string | null;
    fileName: string;
}

export const PrayerTimesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
            const response = await fetch(`/2025_ezan/${selectedLocation.fileName}`);
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
            <View style={[styles.timeRow, isCurrent && styles.currentTimeRow]}>
                <View style={styles.timeLabelContainer}>
                    <Ionicons name={icon as any} size={24} color={isCurrent ? "#2E7D32" : "#666"} />
                    <Text style={[styles.timeLabel, isCurrent && styles.currentTimeLabel]}>{label}</Text>
                </View>
                <Text style={[styles.timeValue, isCurrent && styles.currentTimeValue]}>{time}</Text>
            </View>
        );
    };

    if (loading && !todayTimes) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Ezan Vakitleri</Text>
                <TouchableOpacity onPress={() => setShowLocationPicker(true)} style={styles.locationButton}>
                    <Ionicons name="location" size={24} color="#2E7D32" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.currentLocationCard}>
                    <View style={styles.locationHeaderRow}>
                        <Text style={styles.locationName}>
                            {settings.prayerLocation?.cityName}
                            {settings.prayerLocation?.districtName ? `, ${settings.prayerLocation.districtName}` : ''}
                        </Text>
                        <TouchableOpacity onPress={handleUseGPS} style={styles.gpsButton}>
                            <Ionicons name="locate" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.dateText}>{todayTimes?.miladi}</Text>
                    <Text style={styles.hicriText}>{todayTimes?.hicri}</Text>
                </View>

                <View style={styles.timesCard}>
                    {nextPrayer && (
                        <View style={styles.nextPrayerInfo}>
                            <Text style={styles.nextPrayerLabel}>{nextPrayer.label} vaktine kalan süre</Text>
                            <Text style={styles.remainingTime}>{nextPrayer.remaining}</Text>
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Konum Seç</Text>
                            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Şehir veya ilçe ara..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <ScrollView style={styles.locationList}>
                            {filteredLocations.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={styles.locationItem}
                                    onPress={() => handleSelectLocation(loc)}
                                >
                                    <Text style={styles.locationItemText}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    locationButton: {
        padding: 4,
    },
    content: {
        padding: 16,
    },
    currentLocationCard: {
        backgroundColor: '#2E7D32',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    locationName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
    },
    locationHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    gpsButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    dateText: {
        fontSize: 16,
        color: '#E8F5E9',
        marginBottom: 4,
    },
    hicriText: {
        fontSize: 14,
        color: '#C8E6C9',
    },
    timesCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    timeLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 18,
        color: '#444',
        marginLeft: 12,
    },
    timeValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    currentTimeRow: {
        backgroundColor: '#E8F5E9',
        borderLeftWidth: 4,
        borderLeftColor: '#2E7D32',
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    currentTimeLabel: {
        color: '#2E7D32',
        fontWeight: 'bold',
    },
    currentTimeValue: {
        color: '#2E7D32',
    },
    nextPrayerInfo: {
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        marginBottom: 8,
    },
    nextPrayerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    remainingTime: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        // For web
        ...Platform.select({
            web: {
                display: 'flex',
            }
        })
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    locationList: {
        flex: 1,
    },
    locationItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    locationItemText: {
        fontSize: 16,
        color: '#333',
    },
});
