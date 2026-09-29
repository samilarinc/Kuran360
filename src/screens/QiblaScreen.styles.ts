import { StyleSheet } from 'react-native';
import { Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        infoCard: {
            ...common.card,
            backgroundColor: theme.primary,
            padding: 24,
            alignItems: 'center',
            elevation: 4,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
        },
        infoTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#FFF',
            marginBottom: 4,
        },
        infoDetail: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.9)',
        },
        nearNotice: {
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.warning,
            backgroundColor: theme.warning + '1A',
        },
        nearNoticeText: {
            fontSize: 15,
            color: theme.text,
            textAlign: 'center',
        },
        compassWrap: {
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 24,
        },
        pointer: {
            position: 'absolute',
            top: -10,
            zIndex: 1,
        },
        alignedText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.success,
            textAlign: 'center',
        },
        hintText: {
            fontSize: 16,
            color: theme.textSecondary,
            textAlign: 'center',
        },
        statusBox: {
            gap: 12,
            alignItems: 'center',
            paddingHorizontal: 16,
        },
    });
};
