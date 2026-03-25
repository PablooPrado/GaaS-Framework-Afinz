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
        setSelectedAdsets: (adsets: string[]) => void;
        setSelectedAds: (ads: string[]) => void;
    };
    availableCampaigns: string[];
    availableAdsets: string[];
    availableAds: string[];
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

    // Filter state
    const [selectedChannels, setSelectedChannels] = useState<('meta' | 'google')[]>(['meta', 'google']);
    const [selectedObjectives, setSelectedObjectives] = useState<('marca' | 'b2c' | 'plurix')[]>(['marca', 'b2c', 'plurix']);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const [selectedAdsets, setSelectedAdsets] = useState<string[]>([]);
    const [selectedAds, setSelectedAds] = useState<string[]>([]);

    // Base: rows in current period (no campaign/adset/ad filter — used for dropdowns)
    const rowsInPeriod = useMemo(() => {
        return rawData.filter(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= dateFrom && itemDate <= dateTo;
            if (!inDateRange) return false;
            const inChannel = selectedChannels.includes(item.channel as 'meta' | 'google');
            if (!inChannel) return false;
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;
            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives]);

    // Fully filtered data (used by all tabs)
    const filteredData = useMemo(() => {
        return rowsInPeriod.filter(item => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;
            return true;
        });
    }, [rowsInPeriod, selectedCampaigns, selectedAdsets, selectedAds]);

    const previousPeriodData = useMemo(() => {
        if (!compareEnabled) return [];

        const duration = dateTo.getTime() - dateFrom.getTime();
        const prevTo = new Date(dateFrom.getTime() - 24 * 60 * 60 * 1000);
        const prevFrom = new Date(prevTo.getTime() - duration);

        return rawData.filter(item => {
            const itemDate = new Date(item.date);
            if (itemDate < prevFrom || itemDate > prevTo) return false;
            if (!selectedChannels.includes(item.channel as 'meta' | 'google')) return false;
            if (item.objective && !selectedObjectives.includes(item.objective as 'marca' | 'b2c' | 'plurix')) return false;
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;
            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns, selectedAdsets, selectedAds, compareEnabled]);

    // --- Dropdown options derived from rowsInPeriod (respects date + channel + objective) ---

    // Campaigns available in the current period
    const availableCampaigns = useMemo(() => {
        const set = new Set<string>();
        rowsInPeriod.forEach(item => set.add(item.campaign));
        return Array.from(set).sort();
    }, [rowsInPeriod]);

    // Adsets available in the current period, filtered by selected campaign
    const availableAdsets = useMemo(() => {
        const set = new Set<string>();
        rowsInPeriod.forEach(item => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return;
            if (item.adset_name) set.add(item.adset_name);
        });
        return Array.from(set).sort();
    }, [rowsInPeriod, selectedCampaigns]);

    // Ads available in the current period, filtered by selected campaign + adset
    const availableAds = useMemo(() => {
        const set = new Set<string>();
        rowsInPeriod.forEach(item => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return;
            if (item.ad_name) set.add(item.ad_name);
        });
        return Array.from(set).sort();
    }, [rowsInPeriod, selectedCampaigns, selectedAdsets]);

    // Handlers
    const toggleChannel = (channel: 'meta' | 'google') =>
        setSelectedChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);

    const toggleObjective = (obj: 'marca' | 'b2c' | 'plurix') =>
        setSelectedObjectives(prev => prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]);

    const toggleCampaign = (campaign: string) =>
        setSelectedCampaigns(prev => prev.includes(campaign) ? prev.filter(c => c !== campaign) : [...prev, campaign]);

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
                selectedAdsets,
                selectedAds,
                isCompareEnabled: compareEnabled
            },
            setFilters: {
                toggleChannel,
                toggleObjective,
                toggleCampaign,
                setSelectedCampaigns,
                setSelectedAdsets,
                setSelectedAds,
            },
            availableCampaigns,
            availableAdsets,
            availableAds
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
