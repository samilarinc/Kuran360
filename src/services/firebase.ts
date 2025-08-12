import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra;

// Try to get config from Expo extra first
let firebaseConfig = extra?.firebase as any | undefined;

// Fallback to env vars (web builds, or if extra missing)
if (!firebaseConfig) {
    const env: any = (globalThis as any).process?.env || {};
    const candidate = {
        apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || env.FIREBASE_API_KEY,
        authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN,
        projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID,
        storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || env.FIREBASE_APP_ID,
        measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID,
    };
    if (candidate.apiKey && candidate.projectId && candidate.appId) {
        firebaseConfig = candidate;
    }
} if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error(
        'Firebase config is missing. Ensure you have a .env file with Firebase keys, app.config.js loads them into extra.firebase, and you have fully restarted the Expo dev server.'
    );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export type { User };
