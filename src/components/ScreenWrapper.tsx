import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { GlobalAudioBar } from './GlobalAudioBar';

interface ScreenWrapperProps {
    children: ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {children}
            </View>
            <GlobalAudioBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});
