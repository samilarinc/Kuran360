import React, { createContext, useContext } from 'react';

type DataAvailability = {
    isDataAvailable: boolean;
    /** Re-checks the stored data and updates isDataAvailable, e.g. after a download finishes or fails. */
    refreshDataAvailability: () => Promise<void>;
};

const DataAvailabilityContext = createContext<DataAvailability | null>(null);

export const DataAvailabilityProvider: React.FC<{ value: DataAvailability; children: React.ReactNode }> = ({ value, children }) => {
    return <DataAvailabilityContext.Provider value={value}>{children}</DataAvailabilityContext.Provider>;
};

export const useDataAvailability = (): DataAvailability => {
    const ctx = useContext(DataAvailabilityContext);
    if (!ctx) throw new Error('useDataAvailability must be used within DataAvailabilityProvider');
    return ctx;
};
