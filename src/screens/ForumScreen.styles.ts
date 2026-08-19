import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: SPACING.md },
  header: { fontSize: FONT_SIZES.large, fontWeight: '700', color: theme.text, marginBottom: SPACING.md },
  card: { backgroundColor: theme.cardBackground, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md, borderColor: theme.border, borderWidth: 1 },
  label: { color: theme.textSecondary, marginBottom: 4 },
  input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 8, padding: 10, color: theme.text, marginBottom: SPACING.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  thread: { padding: SPACING.md, borderRadius: 12, backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, marginBottom: SPACING.sm },
  threadTitle: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: theme.text },
  threadMeta: { fontSize: FONT_SIZES.small, color: theme.textSecondary, marginTop: 4 },
  note: { color: theme.textSecondary, textAlign: 'center', marginVertical: SPACING.md },
});
