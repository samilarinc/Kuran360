import { StyleSheet, Platform } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
  const common = createCommonStyles(theme);
  return StyleSheet.create({
  overlay: {
    ...common.modalOverlayBottom,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
    backgroundColor: theme.background,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  versePreview: {
    marginVertical: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  arabicText: {
    fontSize: FONT_SIZES.large,
    textAlign: 'right',
    lineHeight: FONT_SIZES.large * 1.25,
    marginBottom: SPACING.sm,
    // Aynı font ailesi Verse bileşeni ile hizalı olsun
    fontFamily: Platform.select({
      web: '"Scheherazade New", "Noto Naskh Arabic", Amiri, "Traditional Arabic", "Arabic Typesetting", serif',
      ios: 'Al Nile',
      default: 'serif'
    }) as any,
    color: theme.text,
  },
  translationText: {
    fontSize: FONT_SIZES.medium,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.medium * 1.3,
    color: theme.textSecondary,
  },
  verseInfo: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.primary,
  },
  sizeSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: theme.text,
  },
  sizeScrollView: {
    marginVertical: SPACING.sm,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  sizeButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
    backgroundColor: theme.cardBackground,
  },
  sizeButtonSelected: {
    backgroundColor: theme.primary,
  },
  sizeIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  sizeTitle: {
    fontSize: FONT_SIZES.small - 1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    color: theme.text,
  },
  sizeDescription: {
    fontSize: FONT_SIZES.small - 2,
    textAlign: 'center',
    lineHeight: 14,
    color: theme.textSecondary,
  },
  textOnPrimary: {
    color: '#fff',
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
  },
  platformIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  platformName: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    fontWeight: '500',
    color: theme.text,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
    color: theme.textSecondary,
  },
  hiddenCapture: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 0,
  },
  });
};
