import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { GlobalAudioBar } from '../GlobalAudioBar';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenWrapperProps {
    children: ReactNode;
    // Rendered on top of the screen, above the audio bar (e.g. floating buttons)
    overlay?: ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, overlay }) => {
    const { common } = useTheme();

    return (
        <View style={common.flex1}>
            <View style={common.flex1}>
                {children}
                {overlay}
            </View>
            <GlobalAudioBar />
        </View>
    );
};
