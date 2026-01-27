import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Metrics {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
}

interface PeriodComparisonChartProps {
    current: Metrics;
    previous: Metrics;
    show: boolean;
}

export const PeriodComparisonChart: React.FC<PeriodComparisonChartProps> = ({ current, previous, show }) => {
    if (!show) return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex items-center justify-center text-slate-400">
            <p>Habilite "Comparar anterior" para ver a análise de período.</p>
        </div>
    );

    const renderRow = (label: string, curr: number, prev: number, isCurrency = false, inverse = false) => {
        const change = prev === 0 ? 0 : ((curr - prev) / prev) * 100;
        const isPositive = change > 0;
        const isNeutral = change === 0;

        let color = 'text-slate-500';
        if (!isNeutral) {
            if (isPositive) color = inverse ? 'text-red-500' : 'text-green-500';
            else color = inverse ? 'text-green-500' : 'text-red-500';
        }

        const format = (v: number) => isCurrency
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
            : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

        return (
            <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Anterior</p>
                        <p className="text-sm font-medium text-slate-500">{format(prev)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Atual</p>
                        <p className="text-sm font-bold text-slate-700">{format(curr)}</p>
                    </div>
                    <div className={`w-16 text-right font-bold text-sm ${color}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                Comparativo de Período
            </h3>
            <div className="space-y-1">
                {renderRow('Investimento', current.spend, previous.spend, true, true)}
                {renderRow('Impressões', current.impressions, previous.impressions)}
                {renderRow('Cliques', current.clicks, previous.clicks)}
                {renderRow('Conversões', current.conversions, previous.conversions)}
            </div>
        </div>
    );
};
