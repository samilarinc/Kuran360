import React, { ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { GlobalAudioBar } from '../GlobalAudioBar';
import { useTheme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';

interface ScreenWrapperProps {
    children: ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
    const { theme } = useTheme();
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <View style={common.flex1}>
            <View style={common.flex1}>
                {children}
            </View>
            <GlobalAudioBar />
        </View>
    );
};
