import { Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';

/**
 * Keep a recitation or dhikr going when the screen locks or the app goes to the background, play with
 * the iPhone's silent switch on, and pause other apps' audio while ours plays.
 *
 * Recitations and duas also show in the media notification / lock screen while they play
 * (src/services/audioPlayer.ts); on Android that notification's foreground service keeps them going.
 * iOS needs UIBackgroundModes audio in app.config.js. The speech module (modules/quran-speech) switches
 * the session to recording itself while it listens; expo-audio applies this mode again when it plays.
 */
export const configureAudioMode = async () => {
    if (Platform.OS === 'web') return;
    try {
        await setAudioModeAsync({
            shouldPlayInBackground: true,
            playsInSilentMode: true,
            interruptionMode: 'doNotMix',
            interruptionModeAndroid: 'doNotMix',
            allowsRecording: false,
            shouldRouteThroughEarpiece: false,
        });
    } catch (error) {
        console.warn('Failed to set audio mode:', error);
    }
};
