import React from 'react';
import { useFilters } from '../context/FilterContext';
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

const objectiveChipClass = (objective: 'marca' | 'b2c' | 'plurix', active: boolean): string => {
    if (objective === 'marca') {
        return active
            ? 'bg-violet-50/40 border-violet-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200/70';
    }
    if (objective === 'b2c') {
        return active
            ? 'bg-orange-50/40 border-orange-300/70 text-slate-700 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200/70';
    }
    return active
        ? 'bg-cyan-50/40 border-cyan-300/70 text-slate-700 shadow-sm'
        : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-200/70';
};

export const FilterBar: React.FC = () => {
    const {
        filters,
        setFilters,
        availableCampaigns
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
                    {(['marca', 'b2c', 'plurix'] as const).map((obj) => (
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
                            {obj === 'marca' ? 'Branding' : obj === 'b2c' ? 'Performance (B2C)' : 'Plurix'}
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Campaign Select */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                <div className="relative w-full">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <select
                        className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-md py-1.5 pl-8 pr-8 focus:ring-1 focus:ring-[#00C6CC] outline-none appearance-none hover:border-slate-300 transition-colors"
                        value={filters.selectedCampaigns.length === 1 ? filters.selectedCampaigns[0] : ""}
                        onChange={(e) => {
                            if (e.target.value === "") {
                                setFilters.setSelectedCampaigns([]);
                            } else {
                                setFilters.setSelectedCampaigns([e.target.value]);
                            }
                        }}
                    >
                        <option value="">Todas as Campanhas ({availableCampaigns.length})</option>
                        {availableCampaigns.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
            </div>

        </div>
    );
};
