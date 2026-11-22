import { Platform } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/**
 * Keep a recitation or dhikr going when the screen locks or the app goes to the background, and pause
 * other apps' audio while ours plays.
 *
 * Android: this also keeps expo-av from refusing audio focus after the activity was destroyed while the
 * process lived on (the prayer foreground service keeps it alive). expo-av drops its lifecycle listener in
 * onHostDestroy while it still thinks the app is paused, so without staysActiveInBackground every play
 * after reopening failed with "This experience is currently in the background".
 *
 * iOS needs UIBackgroundModes audio in app.config.js for background playback.
 */
export const configureAudioMode = async () => {
    if (Platform.OS === 'web') return;
    try {
        await Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: false,
            allowsRecordingIOS: false,
        });
    } catch (error) {
        console.warn('Failed to set audio mode:', error);
    }
};
