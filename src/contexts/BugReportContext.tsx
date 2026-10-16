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

    useShakeDetector(openBugReport, !visible);

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
