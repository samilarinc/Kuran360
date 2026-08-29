import { StyleSheet } from 'react-native';
import { SPACING } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: any) => {
  const common = createCommonStyles(theme);

  return StyleSheet.create({
    container: common.container,
    listContainer: {
      paddingBottom: SPACING.xl,
    },
  });
};
