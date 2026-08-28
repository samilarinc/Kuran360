import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { AppButton } from '../components/AppButton';
import { LoadingView } from '../components/LoadingView';
import { SPACING, FONT_SIZES } from '../theme';
import { createStyles } from './HutbeScreen.styles';

export const HutbeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const baseUrl = Platform.OS === 'web' ? '' : 'https://kuran360.com';
    // Add cache busting to ensure the latest PDF is always fetched
    const pdfUrl = useMemo(() => `${baseUrl}/hutbe/hutbe.pdf?t=${Date.now()}`, [baseUrl]);
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
        await WebBrowser.openBrowserAsync(pdfUrl);
    };

    if (exists === false) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <AppHeader
                    title={t('hutbeScreen.errorTitle')}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
                <View style={[styles.mobileContainer, { flex: 1 }]}>
                    <Ionicons name="warning-outline" size={80} color={theme.error} />
                    <Text style={[styles.mobileText, { color: theme.textSecondary }]}>{t('hutbeScreen.notFound')}</Text>
                    <AppButton
                        title={t('hutbeScreen.goBack')}
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
                title={t('screenTitles.hutbe')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <View style={styles.content}>
                {exists === null ? (
                    <LoadingView />
                ) : Platform.OS === 'web' ? (
                    <iframe
                        src={pdfUrl}
                        style={{
                            width: '100%',
                            height: Dimensions.get('window').height - 100,
                            border: 'none',
                        }}
                        title={t('screenTitles.hutbe')}
                    />
                ) : (
                    <View style={styles.mobileContainer}>
                        <Ionicons name="document-text-outline" size={80} color={theme.primary} />
                        <Text style={[styles.mobileText, { color: theme.textSecondary }]}>{t('hutbeScreen.tapToOpen')}</Text>
                        <AppButton
                            title={t('hutbeScreen.openHutbe')}
                            onPress={handleOpenInBrowser}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};


