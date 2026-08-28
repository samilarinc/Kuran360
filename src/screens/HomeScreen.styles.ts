import { StyleSheet } from 'react-native';
import { Theme } from '../contexts/ThemeContext';
import { SPACING } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: Theme) => {
  const common = createCommonStyles(theme as any);

  return StyleSheet.create({
    container: common.container,
    searchContainer: {
      marginHorizontal: SPACING.md,
      marginTop: SPACING.md,
    },
  });
};
