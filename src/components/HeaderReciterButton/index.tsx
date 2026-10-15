import React from 'react';
import { useTranslation } from 'react-i18next';
import { Speech } from 'lucide-react-native';
import { HeaderIconButton } from '@/components/HeaderIconButton';

interface HeaderReciterButtonProps {
    onPress: () => void;
}

/** Header button that opens the reciter picker; the picker modal itself is owned by AppHeader. */
export const HeaderReciterButton: React.FC<HeaderReciterButtonProps> = ({ onPress }) => {
    const { t } = useTranslation();
    return <HeaderIconButton icon={Speech} accessibilityLabel={t('reciterSelector.title')} onPress={onPress} />;
};
