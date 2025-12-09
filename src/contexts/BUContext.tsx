import React, { createContext, useContext, useState, useEffect } from 'react';

export type BU = 'B2C' | 'B2B2C' | 'Plurix';

interface BUContextType {
    selectedBUs: BU[];
    toggleBU: (bu: BU) => void;
    selectAll: () => void;
    deselectAll: () => void;
    isBUSelected: (bu: BU) => boolean;
}

const BUContext = createContext<BUContextType | undefined>(undefined);

const STORAGE_KEY = 'growth-brain-bu-selection';

export const BUProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedBUs, setSelectedBUs] = useState<BU[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : ['B2C', 'B2B2C', 'Plurix'];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedBUs));
    }, [selectedBUs]);

    const toggleBU = (bu: BU) => {
        setSelectedBUs(prev => {
            if (prev.includes(bu)) {
                // Prevent deselecting the last one? Optional. Let's allow it for now but maybe warn.
                // Actually, user might want to see nothing.
                return prev.filter(b => b !== bu);
            } else {
                return [...prev, bu];
            }
        });
    };

    const selectAll = () => {
        setSelectedBUs(['B2C', 'B2B2C', 'Plurix']);
    };

    const deselectAll = () => {
        setSelectedBUs([]);
    };

    const isBUSelected = (bu: BU) => selectedBUs.includes(bu);

    return (
        <BUContext.Provider value={{
            selectedBUs,
            toggleBU,
            selectAll,
            deselectAll,
            isBUSelected
        }}>
            {children}
        </BUContext.Provider>
    );
};

export const useBU = () => {
    const context = useContext(BUContext);
    if (context === undefined) {
        throw new Error('useBU must be used within a BUProvider');
    }
    return context;
};
