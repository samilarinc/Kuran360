import { Vibration } from 'react-native';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { BugReportModal } from '@/components/BugReportModal';
import { useShakeDetector } from '@/hooks/useShakeDetector';

type BugReportContextType = {
    openBugReport: () => void;
    /** The navigator reports the visible screen so it can go into the report */
    setCurrentScreen: (screen: string) => void;
    /** Goes up after each report sent, so lists of reports know to reload */
    submittedCount: number;
};

const SHAKE_VIBRATION_MS = 80;

const BugReportContext = createContext<BugReportContextType | undefined>(undefined);

export const BugReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [submittedCount, setSubmittedCount] = useState(0);
    const screenRef = useRef('');

    const openBugReport = useCallback(() => setVisible(true), []);
    const setCurrentScreen = useCallback((screen: string) => { screenRef.current = screen; }, []);
    const value = useMemo(
        () => ({ openBugReport, setCurrentScreen, submittedCount }),
        [openBugReport, setCurrentScreen, submittedCount],
    );

    // A short buzz tells the user the report screen opened because of the shake. A plain vibration, not a haptic
    // effect: Android skips haptic effects when the system's touch feedback is turned off.
    const openFromShake = useCallback(() => {
        Vibration.vibrate(SHAKE_VIBRATION_MS);
        setVisible(true);
    }, []);
    useShakeDetector(openFromShake, !visible);

    return (
        <BugReportContext.Provider value={value}>
            {children}
            <BugReportModal
                visible={visible}
                screenRef={screenRef}
                onClose={() => setVisible(false)}
                onSubmitted={() => setSubmittedCount(c => c + 1)}
            />
        </BugReportContext.Provider>
    );
};

export const useBugReport = (): BugReportContextType => {
    const context = useContext(BugReportContext);
    if (!context) {
        throw new Error('useBugReport must be used within a BugReportProvider');
    }
    return context;
};
