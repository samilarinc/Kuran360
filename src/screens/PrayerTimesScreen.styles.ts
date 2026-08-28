import { StyleSheet, Platform } from 'react-native';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        ...common,
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 48,
            paddingBottom: 16,
            backgroundColor: theme.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backButton: {
            padding: 4,
        },
        title: {
            ...common.title,
            fontSize: 20,
            marginBottom: 0,
        },
        locationButton: {
            padding: 4,
        },
        content: {
            padding: 16,
        },
        currentLocationCard: {
            ...common.card,
            backgroundColor: theme.primary,
            padding: 24,
            alignItems: 'center',
            elevation: 4,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
        },
        locationName: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFF',
            flex: 1,
        },
        locationHeaderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 8,
        },
        dateText: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.9)',
            marginBottom: 4,
        },
        hicriText: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
        },
        timesCard: {
            ...common.card,
            padding: 16,
        },
        timeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        timeLabelContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        timeLabel: {
            fontSize: 18,
            color: theme.textSecondary,
            marginLeft: 12,
        },
        timeValue: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
        },
        currentTimeRow: {
            borderLeftWidth: 4,
            marginHorizontal: -16,
            paddingHorizontal: 16,
        },
        currentTimeLabel: {
            fontWeight: 'bold',
            color: theme.primary,
        },
        currentTimeValue: {
            color: theme.primary,
        },
        nextPrayerInfo: {
            alignItems: 'center',
            paddingBottom: 16,
            borderBottomWidth: 1,
            marginBottom: 8,
            borderBottomColor: theme.border,
        },
        nextPrayerLabel: {
            fontSize: 14,
            marginBottom: 4,
            color: theme.textSecondary,
        },
        remainingTime: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.primary,
        },
        modalContent: {
            ...common.modalContent,
            backgroundColor: theme.cardBackground,
            width: '90%',
            maxHeight: '80%',
            padding: 20,
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        modalTitle: {
            ...common.modalTitle,
            marginBottom: 0,
        },
        searchContainer: {
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 16,
            borderColor: theme.border,
            width: '100%',
        },
        locationList: {
            flex: 1,
        },
        locationItem: {
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        locationItemText: {
            fontSize: 16,
            color: theme.text,
        },
    });
};
