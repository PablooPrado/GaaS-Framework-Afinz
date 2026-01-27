import React, { useMemo, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { ProjectionBox } from '../ProjectionBox';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, getDate, getDaysInMonth } from 'date-fns';

import { Target as TargetIcon } from 'lucide-react';
import { CreateTargetModal } from '../Modals/CreateTargetModal';
import { useTargets } from '../../hooks/useTargets';
import { calculateProjection } from '../../utils/projectionEngine';
import type { DailyMetrics } from '../../types';
import { CustomMetricChart } from '../CustomMetricChart';


// Chart Component
const MetricsChart: React.FC<{
    data: any[],
    dataKey: string,
    color: string,
    title: string,
    isCurrency?: boolean,
    projectionKey?: string
}> = ({ data, dataKey, color, title, isCurrency, projectionKey }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="text-md font-bold text-slate-700 mb-4">{title}</h4>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) =>
                                isCurrency
                                    ? new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(val)
                                    : new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(val)
                            }
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: any) =>
                                isCurrency
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
                                    : new Intl.NumberFormat('pt-BR').format(val)
                            }
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.1}
                            name="Atual"
                            strokeWidth={2}
                        />
                        {projectionKey && (
                            <Line
                                type="monotone"
                                dataKey={projectionKey}
                                stroke={color}
                                strokeDasharray="5 5"
                                name="Projeção"
                                dot={false}
                                strokeOpacity={0.6}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const MonthlyAnalysisTab: React.FC = () => {
    const { filteredData, filters } = useFilters();
    const { add } = useTargets();
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

    const chartData = useMemo(() => {
        if (filteredData.length === 0) return [];

        const targetMonthDate = filters.dateRange.to;
        const start = startOfMonth(targetMonthDate);
        const end = endOfMonth(targetMonthDate);
        const today = new Date();

        const days = eachDayOfInterval({ start, end });

        // Aggregate data by day
        return days.map(day => {
            const isFuture = day > today;
            const dayStr = format(day, 'd');
            const dayRows = filteredData.filter(d => isSameDay(new Date(d.date), day));

            const spend = dayRows.reduce((a, b) => a + b.spend, 0);
            const imp = dayRows.reduce((a, b) => a + b.impressions, 0);
            const conv = dayRows.reduce((a, b) => a + b.conversions, 0);

            const cpm = imp ? (spend / imp) * 1000 : 0;

            return {
                day: dayStr,
                date: day,
                spend: isFuture ? null : spend,
                impressions: isFuture ? null : imp,
                cpm: isFuture ? null : cpm,
                conversions: isFuture ? null : conv,
            };
        });
    }, [filteredData, filters]); // Note: Recalculating projection points requires simpler logic here

    // We need to fill "projected" keys for the chart.
    const hydratedData = useMemo(() => {
        if (chartData.length === 0) return [];

        const filled = [...chartData];

        // 1. Calculate Cumulative Past Data in chart structure (for visualization)
        let runningSpend = 0;
        let runningImp = 0;
        let runningConv = 0;

        const accumulated = filled.map((d) => {
            if (d.spend !== null) {
                runningSpend += (d.spend || 0);
                runningImp += (d.impressions || 0);
                runningConv += (d.conversions || 0);
                return {
                    ...d,
                    spend: runningSpend,
                    impressions: runningImp,
                    conversions: runningConv,
                };
            }
            return {
                ...d,
                spend: null,
                impressions: null,
                conversions: null
            };
        });

        // 2. Calculate Slopes using Smart Pace (Engine) using RAW filteredData
        // This ensures match with ProjectionBox
        const targetMonthDate = filters.dateRange.to;

        // Cast to satisfy type (filteredData has compatible shape)
        const rawData = filteredData as unknown as DailyMetrics[];

        const spendProj = calculateProjection(rawData, 'spend', targetMonthDate);
        const impProj = calculateProjection(rawData, 'impressions', targetMonthDate);
        const convProj = calculateProjection(rawData, 'conversions', targetMonthDate);

        const slopeSpend = spendProj.pace;
        const slopeImp = impProj.pace;
        const slopeConv = convProj.pace;

        // Determine cut-off based on raw data presence
        const daysInMonth = getDaysInMonth(targetMonthDate);
        const lastDataDay = daysInMonth - spendProj.remainingDays;

        // Calculate projected constant CPM
        const projectedDailyCPM = slopeImp > 0 ? (slopeSpend / slopeImp) * 1000 : 0;

        // 3. Fill Future
        return accumulated.map((d) => {
            const dayNum = getDate(d.date);

            if (dayNum <= lastDataDay) {
                // Actuals
                return {
                    ...d,
                    projectedSpend: d.spend,
                    projectedImpressions: d.impressions,
                    projectedConversions: d.conversions,
                    projectedCPM: (d.cpm && d.cpm > 0) ? d.cpm : projectedDailyCPM // Fallback to projection if actual CPM is 0 (trailing)
                };
            } else {
                // Future Projection
                const daysAhead = dayNum - lastDataDay;

                const projSpend = spendProj.current + (slopeSpend * daysAhead);
                const projImp = impProj.current + (slopeImp * daysAhead);
                const projConv = convProj.current + (slopeConv * daysAhead);

                // Projected Daily CPM (Constant based on pace)
                const projCPM = projectedDailyCPM;

                return {
                    ...d,
                    projectedSpend: projSpend,
                    projectedImpressions: projImp,
                    projectedConversions: projConv,
                    projectedCPM: projCPM
                };
            }
        });

    }, [chartData, filteredData, filters]);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                    <ProjectionBox data={filteredData} />
                </div>
                <button
                    onClick={() => setIsTargetModalOpen(true)}
                    className="mb-8 flex items-center gap-2 text-primary font-bold hover:underline bg-white px-4 py-3 rounded-lg border border-slate-100 shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                >
                    <TargetIcon size={18} />
                    Definir Metas
                </button>
            </div>



            {/* Nova Seção: Gráfico Personalizado */}
            <CustomMetricChart />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Investimento */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Investimento Acumulado</h4>
                    <div className="h-[250px] w-full">
                        <MetricsChart
                            data={hydratedData}
                            dataKey="spend"
                            color="#84cc16"
                            title="Investimento"
                            isCurrency
                            projectionKey="projectedSpend"
                        />
                    </div>
                </div>

                {/* Impressões */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Impressões Acumuladas</h4>
                    <div className="h-[250px] w-full">
                        <MetricsChart
                            data={hydratedData}
                            dataKey="impressions"
                            color="#0ea5e9"
                            title="Impressões"
                            projectionKey="projectedImpressions"
                        />
                    </div>
                </div>

                {/* CPM */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">CPM Diário</h4>
                    <div className="h-[250px] w-full">
                        <MetricsChart
                            data={hydratedData}
                            dataKey="cpm"
                            color="#f97316"
                            title="CPM"
                            isCurrency
                            projectionKey="projectedCPM"
                        />
                    </div>
                </div>

                {/* Conversões */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Conversões Acumuladas</h4>
                    <div className="h-[250px] w-full">
                        <MetricsChart
                            data={hydratedData}
                            dataKey="conversions"
                            color="#8b5cf6"
                            title="Conversões"
                            projectionKey="projectedConversions"
                        />
                    </div>
                </div>
            </div>





            {isTargetModalOpen && (
                <CreateTargetModal
                    onSave={add}
                    onClose={() => setIsTargetModalOpen(false)}
                />
            )}
        </div>
    );
};
