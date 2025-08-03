// Audio file resolver for different platforms
import { Platform } from 'react-native';

export const getAudioSource = (fileName: string) => {
    // For web, we need to serve files from public folder or use bundled assets
    // For native, we can use local files

    const isWeb = Platform.OS === 'web';

    if (isWeb) {
        // Try to load from assets folder first
        try {
            return require(`../../assets/audio/${fileName}`);
        } catch (error) {
            // Fallback to public folder (you'd need to copy files there)
            return { uri: `/audio/${fileName}` };
        }
    } else {
        // For native platforms, use bundled assets
        try {
            return require(`../../assets/audio/${fileName}`);
        } catch (error) {
            // This shouldn't happen in production, but for development
            console.warn(`Audio file not found in assets: ${fileName}`);
            return null;
        }
    }
};
