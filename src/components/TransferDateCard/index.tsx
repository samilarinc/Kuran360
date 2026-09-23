import React from 'react';
import { View, Text, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TrainFront } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { AppButton } from '@/components/AppButton';
import { DateField } from '@/components/DateField';
import { createStyles as createChromeStyles } from '../TravelCardChrome.styles';

interface TransferDateCardProps {
    fromCityLabel: string;
    toCityLabel: string;
    transferDate: Date | null;
    outboundDate: Date | null;
    inboundDate: Date | null;
    formatDateForDisplay: (date: Date | null) => string;
    formatDateForInput: (date: Date | null) => string;
    showTransferDatePicker: boolean;
    onChangeWeb: (event: any) => void;
    onRequestDatePicker: () => void;
    onDateChange: (event: any, date?: Date) => void;
    onOpenTrainTicket: () => void;
}

export const TransferDateCard: React.FC<TransferDateCardProps> = ({
    fromCityLabel,
    toCityLabel,
    transferDate,
    outboundDate,
    inboundDate,
    formatDateForDisplay,
    formatDateForInput,
    showTransferDatePicker,
    onChangeWeb,
    onRequestDatePicker,
    onDateChange,
    onOpenTrainTicket,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const chrome = useThemedStyles(createChromeStyles);

    return (
        <View style={chrome.plannerCard}>
            <View style={[common.rowGap, common.mbMd]}>
                <TrainFront size={16} color={theme.text} />
                <Text style={[chrome.plannerTitle, common.mb0]}>
                    {t('umrahChecklistScreen.cityTransfer')}
                </Text>
            </View>
            <Text style={[common.subtitle, common.mbSm]}>
                {t('umrahChecklistScreen.transferDateDescription', { from: fromCityLabel, to: toCityLabel })}
            </Text>

            <DateField
                label={t('umrahChecklistScreen.date')}
                displayText={formatDateForDisplay(transferDate)}
                isFilled={!!transferDate}
                inputValue={formatDateForInput(transferDate)}
                minInput={formatDateForInput(outboundDate || new Date())}
                maxInput={inboundDate ? formatDateForInput(inboundDate) : undefined}
                onChangeWeb={onChangeWeb}
                onPress={onRequestDatePicker}
            />

            {transferDate && (
                <AppButton
                    variant="outline"
                    style={chrome.plannerActionBtn}
                    textStyle={chrome.plannerActionBtnText}
                    icon={<TrainFront size={14} color={theme.primary} />}
                    title={t('umrahChecklistScreen.trainTicket')}
                    onPress={onOpenTrainTicket}
                />
            )}

            {Platform.OS !== 'web' && showTransferDatePicker && (
                <DateTimePicker
                    value={transferDate || outboundDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={outboundDate || new Date()}
                    maximumDate={inboundDate || undefined}
                />
            )}
        </View>
    );
};
