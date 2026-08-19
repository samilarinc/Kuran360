import { useEffect, useRef } from 'react';
import { useTheme as useMsarincTheme } from '@msarinc/ui';
import { useSettings } from '../contexts/SettingsContext';

/**
 * settings.theme (Firestore/AsyncStorage üzerinden useQuery ile senkron) ile
 * msarinc-common'ın kendi ThemeProvider state'ini iki yönlü senkronda tutar,
 * böylece topbar'daki ThemeToggle hesaplar arası da senkron tema tercihini yansıtır.
 *
 * `applyingRef` iki efektin birbirini tetikleyip sonsuz döngüye girmesini engeller:
 * bir yön state'i değiştirdiğinde diğer yön bunu "dışarıdan gelen" bir değişiklik
 * sanıp geri yazmaya çalışmasın diye kilitleniyor.
 */
export const ThemeSyncBridge: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { theme: msarincTheme, setTheme: setMsarincTheme } = useMsarincTheme();
    const applyingRef = useRef<'toMsarinc' | 'toSettings' | null>(null);

    useEffect(() => {
        if (applyingRef.current === 'toSettings') {
            applyingRef.current = null;
            return;
        }
        if (msarincTheme !== settings.theme) {
            applyingRef.current = 'toMsarinc';
            setMsarincTheme(settings.theme);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.theme]);

    useEffect(() => {
        if (applyingRef.current === 'toMsarinc') {
            applyingRef.current = null;
            return;
        }
        if (msarincTheme !== settings.theme) {
            applyingRef.current = 'toSettings';
            updateSettings({ theme: msarincTheme });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [msarincTheme]);

    return null;
};
