import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

const TAP_SIZE = 200;

export const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    listContent: {
        ...common.listContent,
        gap: SPACING.sm,
    },
    sectionLabel: {
        ...common.sectionLabel,
        marginTop: SPACING.md,
    },
    formContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl * 2,
    },
    counterContainer: {
        ...common.flex1,
        padding: SPACING.md,
        gap: SPACING.md,
    },
    stepRow: {
        ...common.rowBetween,
        gap: SPACING.md,
    },
    textScroll: {
        flexGrow: 1,
    },
    textCard: {
        ...common.sectionCard,
        flexGrow: 1,
        justifyContent: 'center',
        gap: SPACING.md,
    },
    arabic: {
        fontSize: 32,
        lineHeight: 56,
        textAlign: 'center',
        color: theme.text,
    },
    transliteration: {
        ...common.text,
        fontSize: FONT_SIZES.large,
        textAlign: 'center',
    },
    meaning: {
        ...common.smallText,
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    note: {
        ...common.textAccent,
        textAlign: 'center',
    },
    controls: {
        alignItems: 'center',
        gap: SPACING.md,
    },
    targetRow: {
        ...common.row,
        gap: SPACING.sm,
        alignSelf: 'stretch',
        justifyContent: 'center',
    },
    tapButton: {
        width: TAP_SIZE,
        height: TAP_SIZE,
        borderRadius: TAP_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
        ...SHADOW.md,
    },
    tapCount: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    tapTarget: {
        fontSize: FONT_SIZES.large,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    buttonRow: {
        ...common.row,
        gap: SPACING.sm,
        alignSelf: 'stretch',
        justifyContent: 'center',
    },
    doneCard: {
        ...common.sectionCard,
        alignSelf: 'stretch',
        alignItems: 'center',
        gap: SPACING.sm,
        borderColor: theme.success,
    },
    doneTitle: {
        ...common.title,
        color: theme.success,
    },
});
