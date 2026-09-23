import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { GlobalAudioBar } from '../GlobalAudioBar';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenWrapperProps {
    children: ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
    const { common } = useTheme();

    return (
        <View style={common.flex1}>
            <View style={common.flex1}>
                {children}
            </View>
            <GlobalAudioBar />
        </View>
    );
};
