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

export const HutbeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Hata</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={[styles.mobileContainer, { flex: 1 }]}>
                    <Ionicons name="warning-outline" size={80} color="#D32F2F" />
                    <Text style={styles.mobileText}>Hutbe dosyası bulunamadı.</Text>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#D32F2F' }]} onPress={() => navigation.goBack()}>
                        <Text style={styles.buttonText}>Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Cuma Hutbesi</Text>
                <View style={{ width: 32 }} />
            </View>

            <View style={styles.content}>
                {exists === null ? (
                    <View style={styles.mobileContainer}>
                        <ActivityIndicator size="large" color="#2E7D32" />
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
                        <Ionicons name="document-text-outline" size={80} color="#2E7D32" />
                        <Text style={styles.mobileText}>Hutbeyi okumak için butona tıklayın.</Text>
                        <TouchableOpacity style={styles.button} onPress={handleOpenInBrowser}>
                            <Text style={styles.buttonText}>Hutbeyi Aç</Text>
                        </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
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
        color: '#666',
    },
    button: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        elevation: 3,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
