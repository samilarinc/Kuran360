import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import {
    TRAVEL_CHECK_INTERVAL_MS,
    checkTravelLocation,
    findPrayerLocation,
    syncPrayerNotifications,
} from '@/services/prayerTimes';

/**
 * Background upkeep for prayer times while the app is open, wherever the user is:
 * - travel mode: switches the location when the device has moved (at most once an hour)
 * - the notifications (alerts and the ongoing one): re-sent when the location or language
 *   changes, and on every return to the app so a new year's times reach them
 */
export const PrayerTimesSync: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { t, i18n } = useTranslation();
    const locationId = settings.prayerLocation?.id;
    const updateSettingsRef = useRef(updateSettings);
    updateSettingsRef.current = updateSettings;

    useEffect(() => {
        const checkTravel = () =>
            checkTravelLocation(locationId)
                .then(moved => {
                    if (moved) {
                        updateSettingsRef.current({
                            prayerLocation: { id: moved.id, cityName: moved.cityName, districtName: moved.districtName || null },
                        });
                    }
                })
                .catch(error => console.warn('Travel mode location check failed:', error));

        const refreshNotification = () =>
            syncPrayerNotifications(findPrayerLocation(locationId), t, i18n.language)
                .catch(error => console.warn('Prayer notification refresh failed:', error));

        checkTravel();
        refreshNotification();
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active') return;
            checkTravel();
            refreshNotification();
        });
        const timer = setInterval(checkTravel, TRAVEL_CHECK_INTERVAL_MS);
        return () => {
            subscription.remove();
            clearInterval(timer);
        };
    }, [locationId, t, i18n.language]);

    return null;
};
