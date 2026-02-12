import 'dotenv/config';

export default ({ config }) => ({
    ...config,
    name: "Kuran360",
    slug: "kuran360",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: process.env.APP_SCHEME || "kuran360",
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#2E7D32"
    },
    assetBundlePatterns: [
        "**/*"
    ],
    ios: {
        supportsTablet: true
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#2E7D32"
        },
        package: "com.kuran360",
        softwareKeyboardLayoutMode: "pan"
    },
    web: {
        favicon: "./public/favicon.png",
        name: "Kuran360",
        shortName: "Kuran360",
        lang: "tr",
        scope: "/",
        themeColor: "#2E7D32",
        backgroundColor: "#2E7D32",
        startUrl: "/",
        display: "standalone",
        orientation: "portrait",
        dir: "auto",
        preferRelatedApplications: false,
        description: "Quran reading and listening application",
        bundler: "metro",
        config: {
            firebase: {
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
            }
        }
    },
    plugins: [
        "expo-asset"
    ],
    extra: {
        ...(config?.extra || {}),
        firebase: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
            measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
        },
        google: {
            expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        }
    }
});
