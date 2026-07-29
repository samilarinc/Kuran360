import 'dotenv/config';
import { withGradleProperties, withAppBuildGradle } from '@expo/config-plugins';

function withReleaseSigningConfig(config) {
    config = withGradleProperties(config, (c) => {
        const storeFile = process.env.MYAPP_RELEASE_STORE_FILE || 'kuran360-release.keystore';
        const keystoreProps = [
            { type: 'property', key: 'MYAPP_RELEASE_STORE_FILE', value: `../../${storeFile}` },
            { type: 'property', key: 'MYAPP_RELEASE_KEY_ALIAS', value: process.env.MYAPP_RELEASE_KEY_ALIAS || '' },
            { type: 'property', key: 'MYAPP_RELEASE_STORE_PASSWORD', value: process.env.MYAPP_RELEASE_STORE_PASSWORD || '' },
            { type: 'property', key: 'MYAPP_RELEASE_KEY_PASSWORD', value: process.env.MYAPP_RELEASE_KEY_PASSWORD || '' },
        ];
        for (const prop of keystoreProps) {
            const idx = c.modResults.findIndex(p => p.type === 'property' && p.key === prop.key);
            if (idx >= 0) {
                c.modResults[idx].value = prop.value;
            } else {
                c.modResults.push(prop);
            }
        }
        return c;
    });

    config = withAppBuildGradle(config, (c) => {
        let contents = c.modResults.contents;
        if (!contents.includes('signingConfigs.release')) {
            contents = contents.replace(
                /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\})(\s*\n\s*\})/,
                '$1\n        release {\n            storeFile file(MYAPP_RELEASE_STORE_FILE)\n            storePassword MYAPP_RELEASE_STORE_PASSWORD\n            keyAlias MYAPP_RELEASE_KEY_ALIAS\n            keyPassword MYAPP_RELEASE_KEY_PASSWORD\n        }$2'
            );
            contents = contents.replace(
                /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
                '$1signingConfig signingConfigs.release'
            );
        }
        c.modResults.contents = contents;
        return c;
    });

    return config;
}

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
        "expo-asset",
        withReleaseSigningConfig
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
