import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, GoogleAuthProvider, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're in a web environment and get config accordingly
const getFirebaseConfig = () => {
    // Try to get from environment variables first
    const envConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    // If environment variables are available, use them
    if (envConfig.apiKey && envConfig.projectId) {
        return envConfig;
    }

    // For web builds where env vars might not be available, use fallback
    if (Platform.OS === 'web') {
        // Import the fallback config dynamically
        try {
            const { firebaseConfig } = require('@/config/firebase-config.js');
            return firebaseConfig;
        } catch (error) {
            console.warn('Failed to load fallback config:', error);
        }
    }

    // For native builds, try to use Constants
    try {
        const Constants = require('expo-constants').default;
        const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra;
        if (extra?.firebase) {
            return extra.firebase;
        }
    } catch (error) {
        console.warn('Failed to load config from Constants:', error);
    }

    return envConfig; // Return env config as last resort
};

const firebaseConfig = getFirebaseConfig();

if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.error('Firebase config:', firebaseConfig);
    console.error('Available env vars:', {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
    });
    throw new Error('Firebase configuration is missing. Please check your environment variables.');
}

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for native platforms
export const auth = Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        // @ts-ignore: getReactNativePersistence is available in react-native environment but not in web types
        persistence: getReactNativePersistence(AsyncStorage)
    });

// Persistent local cache: bookmarks/dua list/forum data (and settings) stay readable
// and writable offline, then sync once the connection comes back.
const createFirestore = () => {
    try {
        return initializeFirestore(app, {
            localCache: persistentLocalCache(
                Platform.OS === 'web' ? { tabManager: persistentMultipleTabManager() } : undefined
            ),
        });
    } catch (error) {
        console.warn('Firestore persistent cache unavailable, falling back to memory cache:', error);
        return getFirestore(app);
    }
};

export const db = createFirestore();
export const googleProvider = new GoogleAuthProvider();

export default app;
