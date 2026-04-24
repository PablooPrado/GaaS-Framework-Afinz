import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DailyMetrics, FilterState, AdCreative, PaidMediaObjectiveEntry } from '../types';
import { endOfDay, format, startOfDay } from 'date-fns';
import { usePeriod } from '../../../contexts/PeriodContext';
import { dataService } from '../../../services/dataService';

// ── Objective Registry (localStorage) ────────────────────────────────────────

const OBJ_STORAGE_KEY = 'paid_media_objectives_v1';

const OBJ_DEFAULTS: PaidMediaObjectiveEntry[] = [
    { key: 'marca',   label: 'Branding (Marca)',   color: 'violet' },
    { key: 'b2c',     label: 'Performance (B2C)',  color: 'blue'   },
    { key: 'plurix',  label: 'Plurix',             color: 'purple' },
    { key: 'seguros', label: 'Seguros',            color: 'orange' },
];

function loadObjectives(): PaidMediaObjectiveEntry[] {
    try {
        const raw = localStorage.getItem(OBJ_STORAGE_KEY);
        if (!raw) return OBJ_DEFAULTS;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        return OBJ_DEFAULTS;
    } catch {
        return OBJ_DEFAULTS;
    }
}

function saveObjectives(list: PaidMediaObjectiveEntry[]) {
    try { localStorage.setItem(OBJ_STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

// ── Context type ──────────────────────────────────────────────────────────────

interface FilterContextType {
    rawData: DailyMetrics[];
    filteredData: DailyMetrics[];
    previousPeriodData: DailyMetrics[];
    setRawData: (data: DailyMetrics[]) => void;
    filters: FilterState;
    setFilters: {
        toggleChannel: (channel: 'meta' | 'google') => void;
        toggleObjective: (obj: string) => void;
        toggleCampaign: (campaign: string) => void;
        setSelectedCampaigns: (campaigns: string[]) => void;
        setSelectedAdsets: (adsets: string[]) => void;
        setSelectedAds: (ads: string[]) => void;
    };
    availableCampaigns: string[];
    availableAdsets: string[];
    availableAds: string[];
    adCreatives: AdCreative[];
    refreshCreatives: () => Promise<void>;
    // Objective registry
    objectives: PaidMediaObjectiveEntry[];
    addObjective: (entry: PaidMediaObjectiveEntry) => void;
    updateObjective: (key: string, updates: Partial<Omit<PaidMediaObjectiveEntry, 'key'>>) => void;
    removeObjective: (key: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

import { useAppStore } from '../../../store/useAppStore';

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { paidMediaData: rawDataFromStore, setPaidMediaData: setRawDataFromStore } = useAppStore();
    const rawData = rawDataFromStore as unknown as DailyMetrics[];
    const setRawData = setRawDataFromStore as unknown as (data: DailyMetrics[]) => void;

    const { startDate, endDate, compareEnabled } = usePeriod();
    const dateFrom = startOfDay(startDate);
    const dateTo = endOfDay(endDate);

    // ── Objective registry state ──────────────────────────────────────────────
    const [objectives, setObjectives] = useState<PaidMediaObjectiveEntry[]>(loadObjectives);

    const addObjective = useCallback((entry: PaidMediaObjectiveEntry) => {
        setObjectives(prev => {
            if (prev.find(o => o.key === entry.key)) return prev;
            const next = [...prev, entry];
            saveObjectives(next);
            return next;
        });
    }, []);

    const updateObjective = useCallback((key: string, updates: Partial<Omit<PaidMediaObjectiveEntry, 'key'>>) => {
        setObjectives(prev => {
            const next = prev.map(o => o.key === key ? { ...o, ...updates } : o);
            saveObjectives(next);
            return next;
        });
    }, []);

    const removeObjective = useCallback((key: string) => {
        setObjectives(prev => {
            const next = prev.filter(o => o.key !== key);
            saveObjectives(next);
            return next;
        });
        setSelectedObjectives(prev => prev.filter(k => k !== key));
    }, []);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [selectedChannels, setSelectedChannels] = useState<('meta' | 'google')[]>(['meta', 'google']);
    const [selectedObjectives, setSelectedObjectives] = useState<string[]>(() => loadObjectives().map(o => o.key));
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const [selectedAdsets, setSelectedAdsets] = useState<string[]>([]);
    const [selectedAds, setSelectedAds] = useState<string[]>([]);

    // Auto-select newly added objectives
    useEffect(() => {
        setSelectedObjectives(prev => {
            const newKeys = objectives.map(o => o.key).filter(k => !prev.includes(k));
            if (newKeys.length === 0) return prev;
            return [...prev, ...newKeys];
        });
    }, [objectives]);

    // Hierarchy fetched directly from DB filtered by current period
    type HierarchyRow = { campaign: string; adset_name: string | null; ad_name: string | null };
    const [adHierarchy, setAdHierarchy] = useState<HierarchyRow[]>([]);
    const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);

    const refreshCreatives = async () => {
        try {
            const data = await dataService.fetchAdCreatives();
            setAdCreatives(data as AdCreative[]);
        } catch (err) {
            console.error('Failed to fetch ad creatives:', err);
        }
    };

    useEffect(() => {
        const from = format(dateFrom, 'yyyy-MM-dd');
        const to = format(dateTo, 'yyyy-MM-dd');
        dataService.fetchAdHierarchy(from, to).then(setAdHierarchy).catch(console.error);
    }, [dateFrom.getTime(), dateTo.getTime()]);

    useEffect(() => { refreshCreatives(); }, []);

    // ── Filtered data ─────────────────────────────────────────────────────────
    const rowsInPeriod = useMemo(() => {
        return rawData.filter(item => {
            const d = new Date(item.date);
            if (d < dateFrom || d > dateTo) return false;
            if (!selectedChannels.includes(item.channel as 'meta' | 'google')) return false;
            if (item.objective && !selectedObjectives.includes(item.objective)) return false;
            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives]);

    const filteredData = useMemo(() => {
        return rowsInPeriod.filter(item => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;
            return true;
        });
    }, [rowsInPeriod, selectedCampaigns, selectedAdsets, selectedAds]);

    const previousPeriodData = useMemo(() => {
        const duration = dateTo.getTime() - dateFrom.getTime();
        const prevTo = new Date(dateFrom.getTime() - 86400000);
        const prevFrom = new Date(prevTo.getTime() - duration);
        return rawData.filter(item => {
            const d = new Date(item.date);
            if (d < prevFrom || d > prevTo) return false;
            if (!selectedChannels.includes(item.channel as 'meta' | 'google')) return false;
            if (item.objective && !selectedObjectives.includes(item.objective)) return false;
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign)) return false;
            if (selectedAdsets.length > 0 && (!item.adset_name || !selectedAdsets.includes(item.adset_name))) return false;
            if (selectedAds.length > 0 && (!item.ad_name || !selectedAds.includes(item.ad_name))) return false;
            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedChannels, selectedObjectives, selectedCampaigns, selectedAdsets, selectedAds]);

    // ── Dropdown options ──────────────────────────────────────────────────────
    const availableCampaigns = useMemo(() => {
        const set = new Set<string>();
        rowsInPeriod.forEach(item => set.add(item.campaign));
        return Array.from(set).sort();
    }, [rowsInPeriod]);

    const availableAdsets = useMemo(() => {
        const set = new Set<string>();
        adHierarchy.forEach(row => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(row.campaign)) return;
            if (row.adset_name) set.add(row.adset_name);
        });
        return Array.from(set).sort();
    }, [adHierarchy, selectedCampaigns]);

    const availableAds = useMemo(() => {
        const set = new Set<string>();
        adHierarchy.forEach(row => {
            if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(row.campaign)) return;
            if (selectedAdsets.length > 0 && (!row.adset_name || !selectedAdsets.includes(row.adset_name))) return;
            if (row.ad_name) set.add(row.ad_name);
        });
        return Array.from(set).sort();
    }, [adHierarchy, selectedCampaigns, selectedAdsets]);

    // ── Toggle helpers ────────────────────────────────────────────────────────
    const toggleChannel = (ch: 'meta' | 'google') =>
        setSelectedChannels(p => p.includes(ch) ? p.filter(c => c !== ch) : [...p, ch]);
    const toggleObjective = (obj: string) =>
        setSelectedObjectives(p => p.includes(obj) ? p.filter(o => o !== obj) : [...p, obj]);
    const toggleCampaign = (c: string) =>
        setSelectedCampaigns(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

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
            setFilters: { toggleChannel, toggleObjective, toggleCampaign, setSelectedCampaigns, setSelectedAdsets, setSelectedAds },
            availableCampaigns,
            availableAdsets,
            availableAds,
            adCreatives,
            refreshCreatives,
            objectives,
            addObjective,
            updateObjective,
            removeObjective,
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const ctx = useContext(FilterContext);
    if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
    return ctx;
};
