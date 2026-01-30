import React, { useMemo, useState } from 'react';
import { Activity, Goal } from '../../types/framework';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from 'recharts';
import { useB2CAnalysis } from '../../hooks/useB2CAnalysis';
import { useBU } from '../../contexts/BUContext';
import { useAppStore } from '../../store/useAppStore';
import { Info } from 'lucide-react';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LaunchPlannerKPIsProps {
    activities: Activity[];
    goals: Goal[];
    currentMonth: string; // "YYYY-MM"
}

export const LaunchPlannerKPIs: React.FC<LaunchPlannerKPIsProps> = ({ activities, goals, currentMonth }) => {

    const { dailyAnalysis } = useB2CAnalysis();
    const { isBUSelected } = useBU();
    const { viewSettings } = useAppStore();
    const perspective = viewSettings.perspective;

    // Logic: Hide charts if B2B2C or Plurix is selected (as agreed previously)
    const showCharts = !isBUSelected('B2B2C') && !isBUSelected('Plurix');

    // Interaction State
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const payload = data.activePayload[0].payload;
            // payload.data is YYYY-MM-DD from comparisonData
            if (payload.data) {
                setSelectedDate(payload.data);
            }
        }
    };

    const handleDotClick = (props: any) => {
        if (props && props.payload && props.payload.data) {
            setSelectedDate(props.payload.data);
        }
    };

    // Filter activities for selected date
    const selectedActivities = useMemo(() => {
        if (!selectedDate) return [];
        return activities.filter(act => {
            const actDate = act.dataDisparo instanceof Date
                ? format(act.dataDisparo, 'yyyy-MM-dd')
                : typeof act.dataDisparo === 'string' ? (act.dataDisparo as string).split('T')[0] : '';
            return actDate === selectedDate;
        });
    }, [selectedDate, activities]);

    const metrics = useMemo(() => {
        let totalCards = 0;
        let goalCards = 0;
        let label = 'Meta';
        const currentGoal = goals.find(g => g.mes === currentMonth);
        const isB2CView = perspective === 'b2c' || perspective === 'total';

        // Logic split by Perspective
        if (perspective === 'b2c' || (perspective === 'total' && !isBUSelected('Plurix') && !isBUSelected('B2B2C'))) {
            // Use Total B2C Data from Daily Analysis (Global View)
            totalCards = dailyAnalysis.reduce((sum, d) => sum + d.emissoes_b2c_total, 0);
            goalCards = currentGoal?.b2c_meta || 0;
            label = 'Meta (Total B2C)';
        } else {
            // CRM Mode (Specific BU or CRM Global)
            if (isBUSelected('Plurix')) {
                totalCards = activities.reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
                goalCards = currentGoal?.plurix_meta || 0;
                label = 'Meta (Plurix)';
            } else if (isBUSelected('B2B2C')) {
                totalCards = activities.reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
                goalCards = currentGoal?.b2b2c_meta || 0;
                label = 'Meta (B2B2C)';
            } else {
                // CRM Global
                totalCards = activities.reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
                goalCards = currentGoal?.cartoes_meta || 0;
                label = 'Meta (CRM)';
            }
        }

        const goalProgress = goalCards > 0 ? (totalCards / goalCards) * 100 : 0;

        return {
            totalCards,
            goalCards,
            goalProgress,
            label
        };
    }, [activities, goals, currentMonth, dailyAnalysis, isBUSelected, perspective]);

    const metaChartData = [
        { name: 'Realizado', value: metrics.totalCards, color: '#3B82F6' }, // Blue
        { name: metrics.label, value: metrics.goalCards, color: '#10B981' }       // Emerald
    ];

    // ... existing comparisonData ...
    const comparisonData = useMemo(() => {
        return dailyAnalysis.map(d => {
            const [y, m, day] = d.data.split('-').map(Number);
            const dateObj = new Date(y, m - 1, day);
            return {
                ...d,
                displayDate: format(dateObj, 'dd/MM', { locale: ptBR }),
                outros_propostas: Math.max(0, d.propostas_b2c_total - d.propostas_crm),
                outros_emissoes: Math.max(0, d.emissoes_b2c_total - d.emissoes_crm),
                cac_medio: d.cac_medio
            };
        });
    }, [dailyAnalysis]);

    const ChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-2 rounded text-[10px] text-slate-200">
                    <p className="font-bold mb-1 border-b border-slate-700 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => {
                        const isCurrency = entry.name.includes('CAC');
                        const val = isCurrency
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)
                            : entry.value.toLocaleString('pt-BR');

                        return (
                            <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {val}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`grid gap-4 mb-2 ${showCharts ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>

            {/* Left Column: Meta & CAC */}
            <div className="space-y-4">

                {/* 1. Cartões vs Meta */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between h-48 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-1 relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-400 text-xs font-medium">Cartões vs Meta</h3>
                                <span title="Visualização do realizado contra a meta definida para o período">
                                    <Info size={12} className="text-slate-600 cursor-help" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-bold text-white">{metrics.totalCards.toLocaleString()}</span>
                                <span className="text-xs text-slate-500">/ {metrics.goalCards.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${metrics.goalProgress >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {metrics.goalProgress.toFixed(1)}%
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={metaChartData} barSize={12}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '10px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {metaChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. CAC Evolution (New) */}
                {showCharts && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-52 flex flex-col">
                        <h3 className="text-slate-400 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                            CAC Evolution (R$) <span title="Evolução do Custo de Aquisição de Cartão ao longo do tempo"><Info size={10} className="text-slate-600" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparisonData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#475569" tick={{ fontSize: 9 }} minTickGap={10} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    <Line type="monotone" dataKey="cac_medio" name="CAC Médio" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 6, onClick: handleDotClick, style: { cursor: 'pointer' } }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>

            {/* Right Column: Propostas & Emissões */}
            {showCharts && (
                <div className="space-y-4">

                    {/* 3. Propostas Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-52 flex flex-col">
                        <h3 className="text-slate-400 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                            Propostas: CRM vs B2C <span title="Comparativo entre propostas geradas via CRM e outros canais B2C"><Info size={10} className="text-slate-600" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#475569" tick={{ fontSize: 9 }} minTickGap={10} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e293b', opacity: 0.5 }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    <Bar dataKey="propostas_crm" name="CRM" stackId="a" fill="#3B82F6" />
                                    <Bar dataKey="outros_propostas" name="Outros B2C" stackId="a" fill="#64748b" opacity={0.5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Emissões Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-48 flex flex-col">
                        <h3 className="text-slate-400 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                            Emissões: CRM vs B2C <span title="Comparativo entre cartões emitidos via CRM e outros canais B2C"><Info size={10} className="text-slate-600" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#475569" tick={{ fontSize: 9 }} minTickGap={10} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e293b', opacity: 0.5 }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    <Bar dataKey="emissoes_crm" name="CRM" stackId="a" fill="#10B981" />
                                    <Bar dataKey="outros_emissoes" name="Outros B2C" stackId="a" fill="#64748b" opacity={0.5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            )}

            {/* Modal */}
            <DailyDetailsModal
                date={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
                activities={selectedActivities}
                onClose={() => setSelectedDate(null)}
            />
        </div>
    );
};
