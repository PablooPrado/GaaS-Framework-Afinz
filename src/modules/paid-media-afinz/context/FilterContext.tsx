import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DailyMetrics, FilterState } from '../types';
import { endOfDay, startOfDay } from 'date-fns';
import { usePeriod } from '../../../contexts/PeriodContext';

interface FilterContextType {
    rawData: DailyMetrics[];
    filteredData: DailyMetrics[];
    previousPeriodData: DailyMetrics[];
    setRawData: (data: DailyMetrics[]) => void;
    filters: FilterState;
    setFilters: {
        toggleChannel: (channel: 'meta' | 'google') => void;
        toggleObjective: (obj: 'marca' | 'b2c' | 'plurix') => void;
        toggleCampaign: (campaign: string) => void;
        setSelectedCampaigns: (campaigns: string[]) => void;
    };
    availableCampaigns: string[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

import { useAppStore } from '../../../store/useAppStore';

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Sync with Global Store
    const { paidMediaData: rawDataFromStore, setPaidMediaData: setRawDataFromStore } = useAppStore();
    const rawData = rawDataFromStore as unknown as DailyMetrics[];
    const setRawData = setRawDataFromStore as unknown as (data: DailyMetrics[]) => void;

    // Use global PeriodContext as source of truth for date range
    const { startDate, endDate, compareEnabled } = usePeriod();
    const dateFrom = startOfDay(startDate);
    const dateTo = endOfDay(endDate);

    // Other filter state (channels, objectives, campaigns)
    const [selectedChannels, setSelectedChannels] = useState<('meta' | 'google')[]>(['meta', 'google']);
    const [selectedObjectives, setSelectedObjectives] = useState<('marca' | 'b2c' | 'plurix')[]>(['marca', 'b2c', 'plurix']);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

    // Derived Data
    const filteredData = useMemo(() => {
        return rawData.filter(item => {
            const itemDate = new Date(item.date);

            // Date Filter (from PeriodContext)
            const inDateRange = itemDate >= dateFrom && itemDate <= dateTo;
            if (!inDateRange) return false;

            // Channel Filter
            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;

            // Objective Filter
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;

            // Campaign Filter
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;

            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns]);

    const previousPeriodData = useMemo(() => {
        if (!compareEnabled) return [];

        const duration = dateTo.getTime() - dateFrom.getTime();
        const prevTo = new Date(dateFrom.getTime() - 24 * 60 * 60 * 1000);
        const prevFrom = new Date(prevTo.getTime() - duration);

        return rawData.filter(item => {
            const itemDate = new Date(item.date);

            const inDateRange = itemDate >= prevFrom && itemDate <= prevTo;
            if (!inDateRange) return false;

            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;

            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;

            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;

            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns, compareEnabled]);

    const availableCampaigns = useMemo(() => {
        const campaigns = new Set<string>();

        rawData.forEach(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= dateFrom && itemDate <= dateTo;

            if (inDateRange) {
                campaigns.add(item.campaign);
            }
        });

        return Array.from(campaigns).sort();
    }, [rawData, dateFrom, dateTo]);

    // Handlers
    const toggleChannel = (channel: 'meta' | 'google') => {
        setSelectedChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };

    const toggleObjective = (obj: 'marca' | 'b2c' | 'plurix') => {
        setSelectedObjectives(prev =>
            prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
        );
    };

    const toggleCampaign = (campaign: string) => {
        setSelectedCampaigns(prev =>
            prev.includes(campaign) ? prev.filter(c => c !== campaign) : [...prev, campaign]
        );
    };

    return (
        <FilterContext.Provider value={{
            rawData,
            filteredData,
            previousPeriodData,
            setRawData,
            filters: {
                dateRange: { from: dateFrom, to: dateTo },
                timeRangeOption: 'custom',
                selectedChannels,
                selectedObjectives,
                selectedCampaigns,
                isCompareEnabled: compareEnabled
            },
            setFilters: {
                toggleChannel,
                toggleObjective,
                toggleCampaign,
                setSelectedCampaigns,
            },
            availableCampaigns
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};
