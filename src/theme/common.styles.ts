import { StyleSheet, Platform, Dimensions } from 'react-native';
import { createBaseStyles, SHADOW } from '@msarinc/ui';
import { SPACING, FONT_SIZES, RADIUS, Theme } from './index';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * App-wide style kit: the generic @msarinc/ui base styles plus the few
 * QuranApp-specific pieces (Arabic text, picker modals, compact cards).
 * Read it through `useTheme().common` instead of recreating it per component.
 */
export const createCommonStyles = (theme: Theme) => {
    const base = createBaseStyles({
        background: theme.background,
        surface: theme.cardBackground,
        text: theme.text,
        textMuted: theme.textSecondary,
        primary: theme.primary,
        onPrimary: '#FFFFFF',
        border: theme.border,
    });

    return StyleSheet.create({
        ...base,

        infoCard: {
            ...base.sectionCard,
            borderRadius: RADIUS.lg,
        },
        sectionCardCompact: {
            ...base.sectionCard,
            padding: SPACING.md,
        },
        compactInput: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: RADIUS.sm,
            padding: 10,
            color: theme.text,
            marginBottom: SPACING.sm,
        },

        arabicText: {
            fontSize: FONT_SIZES.arabic,
            lineHeight: FONT_SIZES.arabic * 1.5,
            textAlign: 'right',
            color: theme.text,
            fontWeight: '600',
            writingDirection: 'rtl',
        },
        // Word-by-word translation chips (Verse, QuranPageScreen)
        wordItem: {
            backgroundColor: theme.surface,
            paddingVertical: SPACING.xs,
            paddingHorizontal: SPACING.xs,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: 'transparent', // keeps chips the same size as wordItemWithRoot, which has a visible border
            minWidth: 60,
            alignItems: 'center',
        },
        // Word chip that can be tapped to open its root (only words that have one)
        wordItemWithRoot: {
            backgroundColor: theme.primary + '15',
            borderWidth: 1,
            borderColor: theme.primary + '40',
        },
        wordArabic: {
            fontSize: FONT_SIZES.small,
            color: theme.text,
            fontWeight: '600',
            textAlign: 'center',
            writingDirection: 'rtl',
        },
        wordTranslation: {
            fontSize: FONT_SIZES.small - 2,
            color: theme.textSecondary,
            textAlign: 'center',
        },
        // Small icon + label buttons in a wrapping row (ImagePreviewModal, VerseVideoActions)
        actionButtonRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.sm,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: 8,
            minWidth: 100,
            gap: SPACING.xs,
            backgroundColor: theme.cardBackground,
        },
        actionButtonText: {
            fontSize: FONT_SIZES.small,
            fontWeight: '500',
            color: theme.text,
        },
        timeSeparator: {
            marginHorizontal: SPACING.sm,
            color: theme.text,
            fontSize: 18,
            fontWeight: '700',
        },

        modalOverlayDark: {
            ...base.modalOverlay,
            backgroundColor: 'rgba(0,0,0,0.9)',
        },
        // Fixed-size centered box for picker/selector modals
        modalContainerCentered: {
            backgroundColor: theme.cardBackground,
            borderRadius: RADIUS.md,
            width: Math.min(screenWidth * 0.9, 420),
            maxHeight: screenHeight * 0.8,
            ...SHADOW.md,
        },

        // Picker modal chrome (GoToVerseModal, TranslationPickerModal, ...)
        pickerOverlay: {
            ...base.modalOverlay,
            padding: 0,
        },
        pickerList: {
            // Not flex: 1 (basis 0): inside a container sized only by maxHeight the list would collapse to nothing
            flexGrow: 1,
            flexShrink: 1,
            padding: SPACING.sm,
        },
        pickerOption: {
            padding: SPACING.md,
            marginVertical: SPACING.xs,
            borderRadius: RADIUS.sm,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        pickerOptionSelected: {
            backgroundColor: theme.primary + '10',
            borderColor: theme.primary + '30',
        },
        pickerHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.background,
        },
        pickerHeaderTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: 'bold',
            color: theme.primary,
        },
        pickerCloseButton: {
            padding: SPACING.xs,
            borderRadius: 4,
        },
        pickerCloseButtonText: {
            fontSize: FONT_SIZES.large,
            color: theme.textSecondary,
            fontWeight: 'bold',
        },
        pickerSearchContainer: {
            padding: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.background,
        },
        pickerSearchInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.textSecondary + '40',
            borderRadius: RADIUS.sm,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.sm,
            backgroundColor: theme.background,
        },
        pickerSearchInput: {
            flex: 1,
            fontSize: FONT_SIZES.medium,
            color: theme.text,
            paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
        },
        pickerClearButton: {
            padding: SPACING.xs,
        },
    });
};

export type CommonStyles = ReturnType<typeof createCommonStyles>;
