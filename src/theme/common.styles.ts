import { StyleSheet, Platform, Dimensions } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from './index';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const centerAlign = {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
};

export const createCommonStyles = (theme: Theme) => {
    const sectionCard = {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
    };
    // sectionCard with the tighter padding used by compact/list-style cards (Forum, ...)
    const sectionCardCompact = {
        ...sectionCard,
        padding: SPACING.md,
    };
    // Bordered text input, smaller radius/padding than the default `input` (Forum, ...)
    const compactInput = {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        color: theme.text,
        marginBottom: SPACING.sm,
    };

    return StyleSheet.create({
    flex1: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    center: centerAlign,
    centerFill: {
        flex: 1,
        ...centerAlign,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // Cards & Sections
    card: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: SPACING.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: SPACING.md,
    },

    // Bordered info card (card + border, no shadow)
    infoCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
    },
    // infoCard variant with the tighter 12px radius used by most screen sections
    sectionCard,
    sectionCardCompact,
    compactInput,

    // Arabic verse text (Verse, AllTranslationsScreen, ...)
    arabicText: {
        fontSize: FONT_SIZES.arabic,
        lineHeight: FONT_SIZES.arabic * 1.5,
        textAlign: 'right',
        color: theme.text,
        fontWeight: '600',
        writingDirection: 'rtl',
    },

    // Typography
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
    },
    text: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    smallText: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
    },
    footerText: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },

    // Inputs
    input: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        backgroundColor: theme.cardBackground,
        color: theme.text,
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        ...Platform.select({
            web: {
                // @ts-ignore
                position: 'fixed' as any,
                top: 0, left: 0, right: 0, bottom: 0,
            }
        })
    },
    modalContent: {
        backgroundColor: theme.cardBackground,
        borderRadius: 24,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 500,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Full-width modal header row: title + close button, bottom border
    // (ImagePreviewModal, ShareModal, ...).
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalHeaderTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
        color: theme.text,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.textSecondary,
    },

    // Fixed-size centered modal box (picker/selector modals), as opposed to
    // modalContent's full-width bottom-sheet-style box
    modalContainerCentered: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        width: Math.min(screenWidth * 0.9, 420),
        maxHeight: screenHeight * 0.8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },

    // Picker/selector modal chrome (GoToVerseModal, TranslationPickerModal, ...):
    // header with title + close button, plus a search bar below it.
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
        borderRadius: 8,
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
    pickerClearButtonText: {
        color: theme.textSecondary,
        fontSize: FONT_SIZES.small,
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        marginBottom: SPACING.lg,
        textAlign: 'center',
        color: theme.text,
    },

    // Checklist/checkbox item label state
    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },

    // Lists
    listContent: {
        padding: SPACING.lg,
    },

    // Typography variants
    titleLarge: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    sectionLabel: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.textSecondary,
        letterSpacing: 0.5,
    },

    // Empty states
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyStateText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    // Modal variants
    modalOverlayDark: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        ...Platform.select({
            web: {
                // @ts-ignore
                position: 'fixed' as any,
                top: 0, left: 0, right: 0, bottom: 0,
            }
        })
    },
    modalOverlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        ...Platform.select({
            web: {
                // @ts-ignore
                position: 'fixed' as any,
                top: 0, left: 0, right: 0, bottom: 0,
            }
        })
    },

    // Badges / tags
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },

    // Forms
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
        color: theme.text,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    note: {
        color: theme.textSecondary,
        textAlign: 'center',
        marginVertical: SPACING.md,
    },
    timeSeparator: {
        marginHorizontal: 8,
        color: theme.text,
        fontSize: 18,
        fontWeight: '700',
    },

    // Modal action buttons
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: SPACING.sm,
    },
    modalButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        marginLeft: SPACING.md,
        minWidth: 80,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: theme.border,
    },
    modalButtonPrimary: {
        backgroundColor: theme.primary,
    },
    modalButtonTextWhite: {
        color: '#fff',
    },
    });
};
