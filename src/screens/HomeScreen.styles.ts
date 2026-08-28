import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { SPACING } from '../constants';

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
});
