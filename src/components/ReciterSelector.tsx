import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

export const ReciterSelector: React.FC = () => {
    const { settings, updateSettings, availableReciters } = useSettings();
    const { theme } = useTheme();

    const handleReciterChange = async (reciterId: string) => {
        await updateSettings({ selectedReciter: reciterId });
    };

    return (
        <View style={createStyles(theme).container}>
            <Text style={createStyles(theme).sectionTitle}>Okuyucu Seçimi</Text>
            <Text style={createStyles(theme).sectionDescription}>
                Ses dosyalarını okuyacak okuyucuyu seçin
            </Text>
            <View style={createStyles(theme).reciterContainer}>
                {availableReciters.map((reciter) => (
                    <TouchableOpacity
                        key={reciter.id}
                        style={[
                            createStyles(theme).reciterItem,
                            settings.selectedReciter === reciter.id && createStyles(theme).selectedReciterItem,
                        ]}
                        onPress={() => handleReciterChange(reciter.id)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                createStyles(theme).reciterText,
                                settings.selectedReciter === reciter.id && createStyles(theme).selectedReciterText,
                            ]}
                        >
                            {reciter.name}
                        </Text>
                        <View style={[
                            createStyles(theme).radioButton,
                            settings.selectedReciter === reciter.id && createStyles(theme).selectedRadioButton,
                        ]}>
                            {settings.selectedReciter === reciter.id && (
                                <View style={createStyles(theme).radioButtonInner} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        marginVertical: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    sectionDescription: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 20,
    },
    reciterContainer: {
        gap: SPACING.sm,
    },
    reciterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        // 3D effect
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedReciterItem: {
        backgroundColor: theme.primary + '15',
        borderColor: theme.primary,
        borderWidth: 2,
        // Enhanced 3D effect for selected state
        elevation: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    reciterText: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
        fontWeight: '500',
        flex: 1,
    },
    selectedReciterText: {
        color: theme.primary,
        fontWeight: '600',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
    },
    selectedRadioButton: {
        borderColor: theme.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.primary,
    },
});