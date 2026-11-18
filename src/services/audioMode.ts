import { Platform } from 'react-native';
import { Audio, InterruptionModeIOS } from 'expo-av';

/**
 * iOS: play recitations, dhikr and sound previews with the ring/silent switch on silent, and keep a
 * recitation going when the screen locks or the app goes to the background (UIBackgroundModes audio in
 * app.config.js). Other apps' audio pauses while ours plays. Android keeps expo-av's defaults.
 * The speech module (modules/quran-speech) switches the session to recording itself while it listens;
 * expo-av applies this mode again the next time it plays.
 */
export const configureAudioMode = async () => {
    if (Platform.OS !== 'ios') return;
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            allowsRecordingIOS: false,
        });
    } catch (error) {
        console.error('Error setting the audio mode:', error);
    }
};
