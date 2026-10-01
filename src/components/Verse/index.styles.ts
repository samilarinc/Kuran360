import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { MARKER_SPACE } from '../SpokenWordMarker/index.styles';
import { FONT_SIZES, SPACING, FAVORITE_COLOR, FAVORITE_COLOR_DARK, Theme } from '@/theme';
import type { CommonStyles } from '@/theme/common.styles';

const headerIconButton = {
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  borderWidth: 1.5,
};

export const createStyles = (theme: Theme, common: CommonStyles) => {
  return StyleSheet.create({
  container: {
    backgroundColor: theme.cardBackground,
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  verseNumber: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Pill instead of a circle when the badge holds a label instead of just the number
  verseNumberWithLabel: {
    width: 'auto',
    minWidth: 40,
    paddingHorizontal: SPACING.md,
    flexShrink: 1,
  },
  verseNumberText: {
    color: '#FFFFFF', // Always white for good contrast
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: theme.secondary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: theme.accent,
  },
  inlineArabicRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  inlineArabicWordWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineArabicWord: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    // keep same font and direction as arabicText; Text merges styles
    cursor: 'pointer',
  },
  inlineArabicWordHover: {
    color: theme.secondary,
  },
  // Words already recited stay colored while the verse plays (same color as the word being recited)
  recitedWord: {
    color: theme.primary,
  },
  // Room under every word for the line and pointer of the recited word
  spokenWordBox: {
    position: 'relative',
    paddingBottom: MARKER_SPACE,
  },
  // Centers the card over the word: a box as wide as the card's maxWidth, centered on the word's middle
  hoverCardWrap: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    width: 200,
    marginLeft: -100,
    alignItems: 'center',
    zIndex: 10,
  },
  // Bottom padding is part of the hover area, so the pointer can get from the word onto the card
  hoverCardBridge: {
    paddingBottom: 8,
  },
  hoverCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: theme.primary,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 200,
    minWidth: 80,
  },
  hoverCardText: {
    color: theme.text,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: FONT_SIZES.medium * 1.2,
  },
  // Same tinted chip as a word-by-word box that has a root
  hoverCardRootChip: {
    ...common.wordItemWithRoot,
    borderRadius: 6,
    paddingTop: 0,
    paddingBottom: 2,
    paddingHorizontal: 8,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 4,
  },
  hoverCardRoot: {
    color: theme.primary,
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  translationText: {
    fontSize: FONT_SIZES.translation,
    lineHeight: FONT_SIZES.translation * 1.4,
    color: theme.text,
    textAlign: 'left',
  },
  transliterationText: {
    fontSize: FONT_SIZES.medium,
    lineHeight: FONT_SIZES.medium * 1.3,
    color: theme.textSecondary,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  translationContainer: {
    paddingVertical: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    paddingLeft: SPACING.sm,
  },
  favoriteTranslationContainer: {
    backgroundColor: FAVORITE_COLOR + '10', // Altın sarısı tint
    borderLeftColor: FAVORITE_COLOR,
    borderLeftWidth: 4,
    borderRadius: 6,
    marginVertical: 2,
  },
  translationTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  favoriteTranslationTitle: {
    color: FAVORITE_COLOR_DARK,
    fontWeight: '700',
  },
  favoriteTranslationTextStyle: {
    fontWeight: '500',
    color: theme.text,
  },
  wordTranslationsContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    color: theme.text,
    marginBottom: SPACING.xs,
  },
  wordTranslationsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    justifyContent: 'flex-end',
  },
  memToggle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memToggleText: {
    color: theme.headerText,
    fontWeight: '600',
  },
  memPanel: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: theme.text,
    fontSize: FONT_SIZES.large,
  },
  memValue: {
    minWidth: 28,
    textAlign: 'center',
    color: theme.text,
    fontWeight: '600',
  },
  memButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  memButtonText: {
    color: theme.headerText,
    fontWeight: '700',
  },
  memToggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  memModeBtn: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 0,
  },
  memModeBtnLeft: {
    borderRightWidth: 0.5,
    borderRightColor: theme.border,
  },
  memModeBtnRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: theme.border,
  },
  memModeText: {
    fontSize: FONT_SIZES.small,
    color: theme.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconButton: headerIconButton,
  });
};
