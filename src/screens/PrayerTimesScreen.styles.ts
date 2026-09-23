import { StyleSheet } from 'react-native';
import { Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
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
        timeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
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
            backgroundColor: theme.primary + '15',
            borderLeftColor: theme.primary,
            borderLeftWidth: 4,
            marginHorizontal: -16,
            paddingHorizontal: 16,
        },
        currentText: {
            fontWeight: 'bold',
            color: theme.primary,
        },
        nextPrayerInfo: {
            alignItems: 'center',
            paddingBottom: 16,
            borderBottomWidth: 1,
            marginBottom: 8,
            borderBottomColor: theme.border,
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
        searchContainer: {
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 16,
            borderColor: theme.border,
            width: '100%',
        },
        locationItem: {
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
    });
};
