import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { AppButton } from '../components/AppButton';
import { SPACING, FONT_SIZES } from '../theme';

export const HutbeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const pdfUrl = '/hutbe/hutbe.pdf';
    const [exists, setExists] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkPdf = async () => {
            try {
                const response = await fetch(pdfUrl, { method: 'HEAD' });
                const contentType = response.headers.get('content-type');
                setExists(response.ok && contentType?.includes('application/pdf') === true);
            } catch (e) {
                setExists(false);
            }
        };
        checkPdf();
    }, []);

    const handleOpenInBrowser = async () => {
        const globalObj = global as any;
        const origin = globalObj.window?.location?.origin || '';
        await WebBrowser.openBrowserAsync(origin + pdfUrl);
    };

    if (exists === false) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <AppHeader
                    title="Hata"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
                <View style={[styles.mobileContainer, { flex: 1 }]}>
                    <Ionicons name="warning-outline" size={80} color={theme.error} />
                    <Text style={[styles.mobileText, { color: theme.textSecondary }]}>Hutbe dosyası bulunamadı.</Text>
                    <AppButton
                        title="Geri Dön"
                        onPress={() => navigation.goBack()}
                        variant="primary"
                        style={{ backgroundColor: theme.error }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title="Cuma Hutbesi"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <View style={styles.content}>
                {exists === null ? (
                    <View style={styles.mobileContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : Platform.OS === 'web' ? (
                    <iframe
                        src={pdfUrl}
                        style={{
                            width: '100%',
                            height: Dimensions.get('window').height - 100,
                            border: 'none',
                        }}
                        title="Cuma Hutbesi"
                    />
                ) : (
                    <View style={styles.mobileContainer}>
                        <Ionicons name="document-text-outline" size={80} color={theme.primary} />
                        <Text style={[styles.mobileText, { color: theme.textSecondary }]}>Hutbeyi okumak için butona tıklayın.</Text>
                        <AppButton
                            title="Hutbeyi Aç"
                            onPress={handleOpenInBrowser}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
    },
    mobileContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mobileText: {
        fontSize: 18,
        textAlign: 'center',
        marginVertical: 20,
    },
});
