import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

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
            const { firebaseConfig } = require('../config/firebase-config.js');
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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
