import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

const MIC_SIZE = 112;

export const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        content: {
            padding: SPACING.md,
            paddingBottom: SPACING.xl * 2,
            gap: SPACING.md,
        },
        warningCard: {
            ...common.row,
            gap: SPACING.sm,
            borderColor: theme.warning,
            backgroundColor: theme.warning + '14',
        },
        statusRow: {
            ...common.rowBetween,
            paddingVertical: SPACING.xs,
            gap: SPACING.md,
        },
        statusValueWrap: {
            ...common.row,
            flex: 1,
            justifyContent: 'flex-end',
        },
        statusValue: {
            ...common.text,
            flexShrink: 1,
            textAlign: 'right',
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: SPACING.xs,
        },
        buttonRow: {
            ...common.rowWrap,
            gap: SPACING.sm,
        },
        micArea: {
            alignItems: 'center',
            paddingVertical: SPACING.lg,
            gap: SPACING.md,
        },
        micButton: {
            width: MIC_SIZE,
            height: MIC_SIZE,
            borderRadius: MIC_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primary,
            ...SHADOW.md,
        },
        micButtonRecording: {
            backgroundColor: theme.error,
        },
        recordingProgress: {
            alignSelf: 'stretch',
        },
        micHint: {
            ...common.subtitle,
            textAlign: 'center',
        },
        transcript: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.8,
            textAlign: 'center',
        },
        resultArabic: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.8,
            marginTop: SPACING.sm,
        },
    });
};
