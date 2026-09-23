import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        verseContainer: {
            flex: 1,
            position: 'relative',
        },
        verseContent: {
            flex: 1,
            width: '100%',
        },
        scrollContentContainer: {
            flexGrow: 1,
            paddingBottom: SPACING.xl * 3, // Extra space for surah info and bottom actions
            paddingHorizontal: SPACING.md,
        },
        surahInfoContainer: {
            ...common.card,
            margin: SPACING.md,
            marginBottom: SPACING.xl, // Extra bottom margin for better scroll space
            elevation: 3,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            backgroundColor: theme.surface,
        },
        surahName: {
            ...common.title,
            marginBottom: 2,
            textAlign: 'center',
        },
        surahArabicName: {
            ...common.subtitle,
            fontWeight: '500',
            textAlign: 'center',
        },
        verseNumberBadge: {
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: 16,
            minWidth: 60,
            alignItems: 'center',
            ...SHADOW.sm,
            backgroundColor: theme.primary,
        },
        verseNumberLabel: {
            ...common.badgeText,
            marginBottom: 2,
            letterSpacing: 0.5,
            color: '#FFFFFF',
        },
        verseNumberText: {
            ...common.title,
            marginBottom: 0,
            color: '#FFFFFF',
        },
        bottomActions: {
            padding: SPACING.md,
            paddingBottom: SPACING.xl, // Extra bottom padding for better accessibility
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.surface,
        },
    });
};
