import React from 'react';
import { useFilters } from '../context/FilterContext';
import type { PaidMediaObjective } from '../types';
import { Share2, Target, ChevronDown, Filter } from 'lucide-react';
import { PeriodSelector } from '../../../components/period-selector/PeriodSelector';

const channelChipClass = (channel: 'meta' | 'google', active: boolean): string => {
    if (channel === 'meta') {
        return active
            ? 'bg-blue-50/40 border-blue-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200/70';
    }
    return active
        ? 'bg-emerald-50/40 border-emerald-300/70 text-slate-700 shadow-sm'
        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200/70';
};

const objectiveChipClass = (objective: PaidMediaObjective, active: boolean): string => {
    if (objective === 'marca') {
        return active
            ? 'bg-violet-50/40 border-violet-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200/70';
    }
    if (objective === 'b2c') {
        return active
            ? 'bg-blue-50/40 border-blue-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200/70';
    }
    if (objective === 'plurix') {
        return active
            ? 'bg-purple-50/40 border-purple-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-purple-200/70';
    }
    if (objective === 'seguros') {
        return active
            ? 'bg-orange-50/40 border-orange-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200/70';
    }
    return active
        ? 'bg-slate-50/40 border-slate-300/70 text-slate-700 shadow-sm'
        : 'bg-white border-slate-200 text-slate-500';
};

export const FilterBar: React.FC = () => {
    const {
        filters,
        setFilters,
        availableCampaigns,
        availableAdsets,
        availableAds,
    } = useFilters();

    return (
        <div className="w-full bg-white border-b border-slate-100 py-2.5 px-6 flex flex-wrap items-center gap-4">

            {/* Period Selector — padrão GaaS */}
            <PeriodSelector />

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Media Channels */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mídia:</span>
                </div>
                <div className="flex items-center gap-2">
                    {(['meta', 'google'] as const).map((channel) => (
                        <label key={channel} className={`
                            cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                            ${channelChipClass(channel, filters.selectedChannels.includes(channel))}
                        `}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.selectedChannels.includes(channel)}
                                onChange={() => setFilters.toggleChannel(channel)}
                            />
                            {channel === 'meta' ? 'Meta Ads' : 'Google Ads'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Objectives */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Objetivo:</span>
                </div>
                <div className="flex items-center gap-2">
                    {(['marca', 'b2c', 'plurix', 'seguros'] as const).map((obj) => (
                        <label key={obj} className={`
                            cursor-pointer select-none px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                            ${objectiveChipClass(obj, filters.selectedObjectives.includes(obj))}
                        `}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.selectedObjectives.includes(obj)}
                                onChange={() => setFilters.toggleObjective(obj)}
                            />
                            {obj === 'marca' ? 'Branding' : obj === 'b2c' ? 'Performance (B2C)' : obj === 'plurix' ? 'Plurix' : 'Seguros'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Campaign Select */}
            <div className="relative min-w-[180px] max-w-xs flex-1">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <select
                    className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-md py-1.5 pl-8 pr-8 focus:ring-1 focus:ring-[#00C6CC] outline-none appearance-none hover:border-slate-300 transition-colors"
                    value={filters.selectedCampaigns.length === 1 ? filters.selectedCampaigns[0] : ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilters.setSelectedCampaigns(val ? [val] : []);
                        // Reset downstream filters when campaign changes
                        setFilters.setSelectedAdsets([]);
                        setFilters.setSelectedAds([]);
                    }}
                >
                    <option value="">Todas as Campanhas ({availableCampaigns.length})</option>
                    {availableCampaigns.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Adset (Grupo de Anúncios) Select */}
            <div className="relative min-w-[160px] max-w-xs flex-1">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                    className={`w-full bg-white border text-xs font-medium text-slate-700 rounded-md py-1.5 pl-8 pr-8 focus:ring-1 focus:ring-[#00C6CC] outline-none appearance-none transition-colors
                        ${availableAdsets.length === 0 ? 'border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 hover:border-slate-300 cursor-pointer'}`}
                    value={filters.selectedAdsets.length === 1 ? filters.selectedAdsets[0] : ""}
                    disabled={availableAdsets.length === 0}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilters.setSelectedAdsets(val ? [val] : []);
                        setFilters.setSelectedAds([]);
                    }}
                >
                    <option value="">
                        {availableAdsets.length === 0 ? 'Sem grupos' : `Todos os Grupos (${availableAdsets.length})`}
                    </option>
                    {availableAdsets.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Ad Select */}
            <div className="relative min-w-[160px] max-w-xs flex-1">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                    className={`w-full bg-white border text-xs font-medium text-slate-700 rounded-md py-1.5 pl-8 pr-8 focus:ring-1 focus:ring-[#00C6CC] outline-none appearance-none transition-colors
                        ${availableAds.length === 0 ? 'border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 hover:border-slate-300 cursor-pointer'}`}
                    value={filters.selectedAds.length === 1 ? filters.selectedAds[0] : ""}
                    disabled={availableAds.length === 0}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilters.setSelectedAds(val ? [val] : []);
                    }}
                >
                    <option value="">
                        {availableAds.length === 0 ? 'Sem anúncios' : `Todos os Anúncios (${availableAds.length})`}
                    </option>
                    {availableAds.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

        </div>
    );
};
