import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalAudioBar } from '../GlobalAudioBar';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenWrapperProps {
    children: ReactNode;
    // Rendered on top of the screen, above the audio bar (e.g. floating buttons)
    overlay?: ReactNode;
}

/**
 * Android 15+ draws the app behind the status and navigation bars (edge-to-edge), so every screen
 * is inset here: the status bar area takes the header color, the navigation bar area the page's.
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, overlay }) => {
    const { theme, common } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[common.flex1, { paddingBottom: insets.bottom, backgroundColor: theme.background }]}>
            <View style={{ height: insets.top, backgroundColor: theme.primary }} />
            <View style={common.flex1}>
                {children}
                {overlay}
            </View>
            <GlobalAudioBar />
        </View>
    );
};
