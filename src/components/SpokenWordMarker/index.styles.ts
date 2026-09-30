import { StyleSheet } from 'react-native';
import { Theme } from '@/theme';

export const POINTER_WIDTH = 14;
export const POINTER_HEIGHT = 10;
/** Empty space between the word's line and the pointer's tip. */
const POINTER_GAP = 4;
/** How far the pointer hangs below the space reserved for it (it may overlap the line below a little). */
const POINTER_OVERFLOW = 3;
/** Room under the word for the pointer, reserved on every word so nothing shifts when one becomes active. */
export const WIDTH_SLACK = 4;
export const CLIP_PAD_X = 12;
/** The band reaches this far above and below the letters (vowel and stop signs rise well above the line box); sideways it reaches half a word space (see padX). */
export const BACKDROP_PAD_TOP = 12;
export const BACKDROP_PAD_BOTTOM = 4;
/** Neighboring bands overlap by this much on each side, so rounding never leaves a seam. */
export const BACKDROP_OVERLAP = 1;
export const CLIP_PAD_Y = 16;
export const MARKER_SPACE = POINTER_HEIGHT + POINTER_GAP - POINTER_OVERFLOW;

/** `color` laid over `base` at the given opacity, as an opaque hex color (#rrggbb). */
const blend = (base: string, color: string, opacity: number): string => {
  const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const [baseRgb, colorRgb] = [channels(base), channels(color)];
  return '#' + baseRgb
    .map((b, i) => Math.round(b + (colorRgb[i] - b) * opacity).toString(16).padStart(2, '0'))
    .join('');
};

export const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  // The two halves of the word: letters not yet recited on the left, recited ones (colored) on the right.
  // The clips reach CLIP_PAD_X / CLIP_PAD_Y beyond the word so marks above, below and past its ends
  // (vowel signs, stop signs) aren't cut off; only the edge between the halves clips.
  pendingClip: {
    position: 'absolute',
    top: -CLIP_PAD_Y,
    bottom: MARKER_SPACE - CLIP_PAD_Y,
    left: -CLIP_PAD_X,
    overflow: 'hidden',
  },
  pendingInner: {
    position: 'absolute',
    top: CLIP_PAD_Y,
    // Wider than the measured word by WIDTH_SLACK, so rounding never wraps or truncates the text
    left: CLIP_PAD_X - WIDTH_SLACK,
  },
  recitedClip: {
    position: 'absolute',
    top: -CLIP_PAD_Y,
    bottom: MARKER_SPACE - CLIP_PAD_Y,
    right: -CLIP_PAD_X,
    overflow: 'hidden',
  },
  recitedInner: {
    position: 'absolute',
    top: CLIP_PAD_Y,
    right: CLIP_PAD_X,
  },
  word: {
    // RN-web: never wrap
    // @ts-ignore web-only style
    whiteSpace: 'nowrap',
  },
  recitedText: {
    color: theme.primary,
  },
  // Band behind the recited part of a word, slightly larger than the letters. Opaque (the tint blended into the
  // card color) and square, so neighboring bands can overlap a pixel without a darker seam or notches.
  backdrop: {
    position: 'absolute',
    top: -BACKDROP_PAD_TOP,
    bottom: MARKER_SPACE - BACKDROP_PAD_BOTTOM,
    backgroundColor: blend(theme.cardBackground, theme.primary, 0.15),
  },
  // Same band for a word that is fully recited
  backdropFull: {
    position: 'absolute',
    top: -BACKDROP_PAD_TOP,
    bottom: MARKER_SPACE - BACKDROP_PAD_BOTTOM,
    backgroundColor: blend(theme.cardBackground, theme.primary, 0.15),
  },
  // Upward triangle under the word, centered on the edge between the two halves
  pointer: {
    position: 'absolute',
    bottom: -POINTER_OVERFLOW,
    marginRight: -POINTER_WIDTH / 2,
    width: 0,
    height: 0,
    borderLeftWidth: POINTER_WIDTH / 2,
    borderRightWidth: POINTER_WIDTH / 2,
    borderBottomWidth: POINTER_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.primary,
  },
  // The plain word underneath is hidden while the two halves are drawn on top of it
  hiddenWord: {
    color: 'transparent',
  },
});
