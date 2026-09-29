import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Platform, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Circle, Line, Rect, Polygon, G, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { getQiblaBearing, getKaabaDistanceKm, shortestAngleDelta } from '@/utils/qibla';
import { createStyles } from './QiblaScreen.styles';

const ALIGNED_TOLERANCE_DEG = 3;
const MAX_COMPASS_SIZE = 320;
const NEAR_KAABA_KM = 1.5;

type LocationState = 'loading' | 'denied' | 'error' | 'ready';

// iOS Safari only hands out orientation data after a tap
const needsCompassGesture = () =>
    Platform.OS === 'web' &&
    typeof (globalThis as any).DeviceOrientationEvent?.requestPermission === 'function';

export const QiblaScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { width } = useWindowDimensions();
    const { heading, status: compassStatus, start: startCompass } = useCompassHeading();
    const [locationState, setLocationState] = useState<LocationState>('loading');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const locate = useCallback(async () => {
        setLocationState('loading');
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationState('denied');
                return;
            }
            const position = await Location.getCurrentPositionAsync({});
            setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setLocationState('ready');
            if (!needsCompassGesture()) startCompass();
        } catch (error) {
            console.error('Error getting location for qibla:', error);
            setLocationState('error');
        }
    }, [startCompass]);

    useEffect(() => {
        locate();
    }, [locate]);

    const bearing = useMemo(
        () => (coords ? getQiblaBearing(coords.latitude, coords.longitude) : null),
        [coords],
    );
    const distanceKm = useMemo(
        () => (coords ? getKaabaDistanceKm(coords.latitude, coords.longitude) : null),
        [coords],
    );

    const compassSize = Math.min(width - 64, MAX_COMPASS_SIZE);
    const isAligned =
        heading !== null && bearing !== null &&
        Math.abs(shortestAngleDelta(heading, bearing)) <= ALIGNED_TOLERANCE_DEG;
    const showDial = locationState === 'ready';
    const isNearKaaba = distanceKm !== null && distanceKm < NEAR_KAABA_KM;
    const compassLive = heading !== null && compassStatus === 'active';

    const renderDial = (qiblaBearing: number) => {
        const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
        const cardinals = [
            { label: t('qiblaScreen.north'), angle: 0, color: theme.error },
            { label: t('qiblaScreen.east'), angle: 90, color: theme.text },
            { label: t('qiblaScreen.south'), angle: 180, color: theme.text },
            { label: t('qiblaScreen.west'), angle: 270, color: theme.text },
        ];

        return (
            <View style={styles.compassWrap}>
                <Svg width={24} height={24} viewBox="0 0 24 24" style={styles.pointer}>
                    <Polygon points="12,22 3,4 21,4" fill={isAligned ? theme.success : theme.accent} />
                </Svg>
                <View style={{ transform: [{ rotate: `${compassLive ? -(heading ?? 0) : 0}deg` }] }}>
                    <Svg width={compassSize} height={compassSize} viewBox="0 0 100 100">
                        <Circle cx={50} cy={50} r={48} fill={theme.cardBackground} stroke={isAligned ? theme.success : theme.border} strokeWidth={isAligned ? 2 : 1} />
                        {ticks.map(angle => {
                            const major = angle % 90 === 0;
                            const medium = angle % 30 === 0;
                            return (
                                <Line
                                    key={angle}
                                    x1={50} y1={3}
                                    x2={50} y2={major ? 9 : medium ? 7 : 5}
                                    stroke={major ? theme.text : theme.textSecondary}
                                    strokeWidth={major ? 1 : 0.5}
                                    transform={`rotate(${angle} 50 50)`}
                                />
                            );
                        })}
                        {cardinals.map(({ label, angle, color }) => (
                            <G key={angle} transform={`rotate(${angle} 50 50)`}>
                                <SvgText x={50} y={20} fontSize={8} fontWeight="bold" fill={color} textAnchor="middle">{label}</SvgText>
                            </G>
                        ))}
                        <G transform={`rotate(${qiblaBearing} 50 50)`}>
                            <Line x1={50} y1={50} x2={50} y2={30} stroke={theme.primary} strokeWidth={2} strokeLinecap="round" />
                            <Rect x={44} y={24} width={12} height={12} rx={1.5} fill="#1B1B1B" />
                            <Rect x={44} y={27.5} width={12} height={2.2} fill={theme.accent} />
                        </G>
                        <Circle cx={50} cy={50} r={2.5} fill={theme.primary} />
                    </Svg>
                </View>
            </View>
        );
    };

    const renderStatus = () => {
        if (locationState === 'loading') {
            return <LoadingView text={t('qiblaScreen.locating')} />;
        }
        if (locationState === 'denied' || locationState === 'error') {
            return (
                <View style={styles.statusBox}>
                    <Text style={styles.hintText}>
                        {t(locationState === 'denied' ? 'qiblaScreen.permissionDeniedMessage' : 'qiblaScreen.locationErrorMessage')}
                    </Text>
                    <AppButton title={t('qiblaScreen.retry')} onPress={locate} />
                </View>
            );
        }
        if (compassStatus === 'idle' || compassStatus === 'denied') {
            return (
                <View style={styles.statusBox}>
                    <Text style={styles.hintText}>
                        {t(compassStatus === 'denied' ? 'qiblaScreen.sensorDeniedMessage' : 'qiblaScreen.startHint')}
                    </Text>
                    <AppButton title={t('qiblaScreen.startCompass')} onPress={startCompass} />
                </View>
            );
        }
        if (compassStatus === 'unsupported') {
            return <Text style={styles.hintText}>{t('qiblaScreen.noSensor')}</Text>;
        }
        if (!compassLive) {
            return <LoadingView text={t('qiblaScreen.calibrating')} />;
        }
        return (
            <View style={styles.statusBox}>
                <Text style={isAligned ? styles.alignedText : styles.hintText}>
                    {t(isAligned ? 'qiblaScreen.aligned' : 'qiblaScreen.turnHint')}
                </Text>
                <Text style={common.smallText}>{t('qiblaScreen.calibrationHint')}</Text>
            </View>
        );
    };

    return (
        <View style={common.container}>
            <AppHeader
                title={t('screenTitles.qibla')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView contentContainerStyle={common.pMd}>
                {bearing !== null && distanceKm !== null && locationState === 'ready' && (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>
                            {t('qiblaScreen.bearing', { degrees: Math.round(bearing) })}
                        </Text>
                        <Text style={styles.infoDetail}>
                            {t('qiblaScreen.distance', { km: Math.round(distanceKm).toLocaleString(i18n.language) })}
                        </Text>
                    </View>
                )}

                {showDial && isNearKaaba && (
                    <View style={styles.nearNotice}>
                        <Text style={styles.nearNoticeText}>{t('qiblaScreen.nearKaaba')}</Text>
                    </View>
                )}

                {showDial && bearing !== null && renderDial(bearing)}

                {renderStatus()}
            </ScrollView>
        </View>
    );
};
