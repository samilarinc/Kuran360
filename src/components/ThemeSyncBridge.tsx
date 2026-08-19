import { useEffect } from 'react';
import { useTheme as useMsarincTheme } from '@msarinc/ui';
import { useSettings } from '../contexts/SettingsContext';

/**
 * settings.theme (Firestore/AsyncStorage üzerinden useQuery ile senkron) ile
 * msarinc-common'ın kendi ThemeProvider state'ini iki yönlü senkronda tutar,
 * böylece topbar'daki ThemeToggle hesaplar arası da senkron tema tercihini yansıtır.
 */
export const ThemeSyncBridge: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { theme: msarincTheme, setTheme: setMsarincTheme } = useMsarincTheme();

    useEffect(() => {
        if (msarincTheme !== settings.theme) {
            setMsarincTheme(settings.theme);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.theme]);

    useEffect(() => {
        if (msarincTheme !== settings.theme) {
            updateSettings({ theme: msarincTheme });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [msarincTheme]);

    return null;
};
