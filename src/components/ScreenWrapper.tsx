import React, { ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { GlobalAudioBar } from './GlobalAudioBar';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './ScreenWrapper.styles';

interface ScreenWrapperProps {
    children: ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {children}
            </View>
            <GlobalAudioBar />
        </View>
    );
};
