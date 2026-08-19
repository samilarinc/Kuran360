import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: SPACING.md },
  header: { fontSize: FONT_SIZES.large, fontWeight: '700', color: theme.text, marginBottom: SPACING.md },
  post: { padding: SPACING.md, borderRadius: 12, backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, marginBottom: SPACING.sm },
  postBody: { fontSize: FONT_SIZES.medium, color: theme.text },
  note: { color: theme.textSecondary, textAlign: 'center', marginVertical: SPACING.md },
  replyBox: { backgroundColor: theme.cardBackground, borderRadius: 12, padding: SPACING.md, borderColor: theme.border, borderWidth: 1 },
  input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 8, padding: 10, color: theme.text, marginBottom: SPACING.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
