import React, { createContext, useContext } from 'react';

type NavigationHelpers = {
    goToSurah: (surahNumber: number) => Promise<void>;
    // replace swaps the current history entry instead of pushing a new one
    goToSurahVerse: (surahNumber: number, verseIndex: number, replace?: boolean) => Promise<void>;
    goToRoot: (root: string) => void;
    // Opens settings from the header on any screen (does nothing when already there)
    goToSettings: () => void;
    goToDataManagement: () => void;
    /** The history entry on screen; screens keep their state per entry (see useScreenState) */
    currentEntry: object;
};

const NavigationContext = createContext<NavigationHelpers | null>(null);

export const NavigationProvider: React.FC<{ value: NavigationHelpers; children: React.ReactNode }> = ({ value, children }) => {
    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigationHelpers = (): NavigationHelpers => {
    const ctx = useContext(NavigationContext);
    if (!ctx) throw new Error('useNavigationHelpers must be used within NavigationProvider');
    return ctx;
};
