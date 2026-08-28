import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: Theme) => {
  const common = createCommonStyles(theme);

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: SPACING.md },
    header: { fontSize: FONT_SIZES.large, fontWeight: '700', color: theme.text, marginBottom: SPACING.md },
    card: { ...common.infoCard, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md },
    label: { color: theme.textSecondary, marginBottom: 4 },
    input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 8, padding: 10, color: theme.text, marginBottom: SPACING.sm },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    thread: { ...common.infoCard, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm },
    threadTitle: { ...common.text, fontWeight: '600' },
    threadMeta: { ...common.smallText, marginTop: 4 },
    note: { color: theme.textSecondary, textAlign: 'center', marginVertical: SPACING.md },
  });
};
