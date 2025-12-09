import React, { useMemo } from 'react';
import { Activity, Goal } from '../../types/framework';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

interface LaunchPlannerKPIsProps {
    activities: Activity[];
    goals: Goal[];
    currentMonth: string; // "YYYY-MM"
}

export const LaunchPlannerKPIs: React.FC<LaunchPlannerKPIsProps> = ({ activities, goals, currentMonth }) => {

    const metrics = useMemo(() => {
        const totalCards = activities.reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
        const totalCost = activities.reduce((sum, act) => sum + (act.kpis?.custoTotal || 0), 0);

        const cac = totalCards > 0 ? totalCost / totalCards : 0;

        // Find goal for current month
        const currentGoal = goals.find(g => g.mes === currentMonth);
        const goalCards = currentGoal?.cartoes_meta || 0;
        const goalProgress = goalCards > 0 ? (totalCards / goalCards) * 100 : 0;

        return {
            totalCards,
            totalCost,
            cac,
            goalCards,
            goalProgress
        };
    }, [activities, goals, currentMonth]);

    const chartData = [
        { name: 'Realizado', value: metrics.totalCards, color: '#3B82F6' }, // Blue
        { name: 'Meta', value: metrics.goalCards, color: '#10B981' }       // Emerald
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            {/* Cards vs Goal Chart */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="text-slate-400 text-xs font-medium">Cartões vs Meta</h3>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xl font-bold text-white">{metrics.totalCards.toLocaleString()}</span>
                            <span className="text-xs text-slate-500">/ {metrics.goalCards.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${metrics.goalProgress >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {metrics.goalProgress.toFixed(1)}%
                    </div>
                </div>
                <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} barSize={8}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '10px' }}
                                itemStyle={{ color: '#f8fafc' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cost Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={40} className="text-blue-400" />
                </div>
                <h3 className="text-slate-400 text-xs font-medium mb-0.5">Investimento Total</h3>
                <span className="text-xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalCost)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Custo estimado das ações</p>
            </div>

            {/* CAC Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-slate-400 text-xs font-medium mb-0.5">CAC</h3>
                <span className="text-xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.cac)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Custo de Aquisição</p>
            </div>
        </div>
    );
};
