export default {
    expo: {
        name: "Kuran360",
        slug: "quranapp",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
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
            }
        },
        web: {
            favicon: "./assets/favicon.png",
            name: "Kuran360"
        },
        plugins: [
            "expo-asset"
        ]
    }
};
