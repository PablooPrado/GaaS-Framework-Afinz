import React, { useState, useMemo } from 'react';
import { useFilters } from '../context/FilterContext';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { Filter } from 'lucide-react';

const METRICS_CONFIG = [
    { key: 'spend', label: 'Investimento', color: '#3b82f6', isCurrency: true, axis: 'left' }, // Blue
    { key: 'conversions', label: 'Conversões', color: '#8b5cf6', isCurrency: false, axis: 'left' }, // Purple
    { key: 'impressions', label: 'Impressões', color: '#06b6d4', isCurrency: false, axis: 'left' }, // Cyan
    { key: 'clicks', label: 'Cliques', color: '#f59e0b', isCurrency: false, axis: 'left' }, // Amber
    { key: 'cpm', label: 'CPM', color: '#ec4899', isCurrency: true, axis: 'right' }, // Pink
    { key: 'cpc', label: 'CPC', color: '#10b981', isCurrency: true, axis: 'right' }, // Emerald
    { key: 'ctr', label: 'CTR', color: '#6366f1', isCurrency: false, suffix: '%', axis: 'right' }, // Indigo
    { key: 'convRate', label: 'Taxa de Conv.', color: '#ef4444', isCurrency: false, suffix: '%', axis: 'right' }, // Red
];

export const CustomMetricChart: React.FC = () => {
    const { rawData, filters } = useFilters();

    // Local State
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['spend', 'conversions']);
    const [useCustomDate, setUseCustomDate] = useState(true); // Default to true
    const [customDateRange, setCustomDateRange] = useState({
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
    });
    const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

    // 1. Filter Data
    const chartData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        let filtered = rawData.filter(d => {
            // Apply Global Campaign/Channel Filters
            // (Replicating logic from FilterContext roughly, or we assume rawData needs filtering)
            const dateObj = new Date(d.date);

            // Channels
            if (filters.selectedChannels.length > 0 && !filters.selectedChannels.includes(d.channel)) return false;

            // Objectives
            if (filters.selectedObjectives.length > 0 && !filters.selectedObjectives.includes(d.objective)) return false;

            // Campaigns
            if (filters.selectedCampaigns.length > 0 && !filters.selectedCampaigns.includes(d.campaign)) return false;

            // Date Range (Local or Global)
            const range = useCustomDate ? {
                start: startOfDay(parseISO(customDateRange.from)),
                end: endOfDay(parseISO(customDateRange.to))
            } : {
                start: startOfDay(filters.dateRange.from),
                end: endOfDay(filters.dateRange.to)
            };

            return isWithinInterval(dateObj, range);
        });

        // Aggregate by Granularity (Day/Week/Month)
        const aggMap = new Map<string, any>();

        filtered.forEach(d => {
            const dateObj = new Date(d.date);
            let timeKey = '';
            let label = '';
            let sortTime = 0;

            if (granularity === 'day') {
                timeKey = format(dateObj, 'yyyy-MM-dd');
                label = format(dateObj, 'dd/MM');
                sortTime = dateObj.getTime();
            } else if (granularity === 'week') {
                const start = startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday
                timeKey = format(start, 'yyyy-MM-dd');
                label = `Semana ${format(start, 'dd/MM')}`;
                sortTime = start.getTime();
            } else if (granularity === 'month') {
                const start = startOfMonth(dateObj);
                timeKey = format(start, 'yyyy-MM');
                label = format(start, 'MMM/yy');
                sortTime = start.getTime();
            }

            if (!aggMap.has(timeKey)) {
                aggMap.set(timeKey, {
                    timeKey,
                    label,
                    sortTime,
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0
                });
            }
            const item = aggMap.get(timeKey);
            item.spend += d.spend;
            item.impressions += d.impressions;
            item.clicks += d.clicks;
            item.conversions += d.conversions;
        });

        // Calculate Derived Metrics
        const result = Array.from(aggMap.values()).map(item => {
            return {
                ...item,
                day: item.label, // Use label for XAxis
                cpm: item.impressions ? (item.spend / item.impressions) * 1000 : 0,
                cpc: item.clicks ? (item.spend / item.clicks) : 0,
                ctr: item.impressions ? (item.clicks / item.impressions) * 100 : 0,
                convRate: item.clicks ? (item.conversions / item.clicks) * 100 : 0,
            };
        }).sort((a, b) => a.sortTime - b.sortTime);

        return result;

    }, [rawData, filters, useCustomDate, customDateRange, granularity]);

    const handleMetricToggle = (key: string) => {
        if (selectedMetrics.includes(key)) {
            setSelectedMetrics(prev => prev.filter(k => k !== key));
        } else {
            if (selectedMetrics.length < 4) {
                setSelectedMetrics(prev => [...prev, key]);
            }
        }
    };

    const hasRightAxisMetrics = selectedMetrics.some(m => METRICS_CONFIG.find(c => c.key === m)?.axis === 'right');
    const hasLeftAxisMetrics = selectedMetrics.some(m => METRICS_CONFIG.find(c => c.key === m)?.axis === 'left');

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Filter size={18} className="text-primary" />
                        Análise Personalizada
                    </h3>
                    <p className="text-sm text-slate-500">Compare até 4 métricas diferentes no mesmo período</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {/* Date Toggle */}
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer mr-2">
                        <input
                            type="checkbox"
                            checked={useCustomDate}
                            onChange={(e) => setUseCustomDate(e.target.checked)}
                            className="rounded text-primary focus:ring-primary/20"
                        />
                        Período Personalizado
                    </label>

                    {useCustomDate && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customDateRange.from}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                                className="text-xs border-slate-200 rounded px-2 py-1 focus:ring-primary/20 focus:border-primary"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={customDateRange.to}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                                className="text-xs border-slate-200 rounded px-2 py-1 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    )}
                </div>

                {/* Granularity Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['day', 'week', 'month'] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGranularity(g)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${granularity === g ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {g === 'day' ? 'Dia' : g === 'week' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {METRICS_CONFIG.map(metric => (
                    <button
                        key={metric.key}
                        onClick={() => handleMetricToggle(metric.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedMetrics.includes(metric.key)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                        style={{
                            borderColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                            color: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                            backgroundColor: selectedMetrics.includes(metric.key) ? `${metric.color}20` : undefined // 20 = ~12% opacity hex
                        }}
                    >
                        {metric.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            hide={!hasLeftAxisMetrics}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            hide={!hasRightAxisMetrics}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                            formatter={(value: any, name: any) => {
                                const metric = METRICS_CONFIG.find(m => m.label === name);
                                if (!metric) return value;

                                if (metric.isCurrency) return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                                if (metric.suffix) return `${value.toFixed(2)}${metric.suffix}`;
                                return new Intl.NumberFormat('pt-BR').format(value);
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {selectedMetrics.map(key => {
                            const metric = METRICS_CONFIG.find(m => m.key === key);
                            if (!metric) return null;
                            return (
                                <Line
                                    key={key}
                                    yAxisId={metric.axis}
                                    type="monotone"
                                    dataKey={key}
                                    name={metric.label}
                                    stroke={metric.color}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
