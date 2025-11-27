import React from 'react';
import { Recommendation } from '../../types/recommendations';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Info, Clock } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface RecommendationCardProps {
    recommendation: Recommendation;
    onClick: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onClick }) => {
    const { combo, score, metrics, insights } = recommendation;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
        if (score >= 60) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
        if (score >= 40) return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
        return 'text-red-400 border-red-500/50 bg-red-500/10';
    };

    const getChannelColor = (canal: string) => {
        const c = canal.toLowerCase();
        if (c.includes('email') || c.includes('e-mail')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        if (c.includes('sms')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        if (c.includes('push')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        if (c.includes('whats')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        return 'bg-slate-700 text-slate-300 border-slate-600';
    };

    const getRecencyInfo = (date: Date | null) => {
        if (!date) return { text: 'Nunca executado', color: 'text-blue-400' };

        const diffTime = Math.abs(new Date().getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return { text: `há ${diffDays} dias`, color: 'text-slate-500' };
        if (diffDays < 14) return { text: `há ${diffDays} dias`, color: 'text-yellow-500' };
        return { text: `há ${diffDays} dias`, color: 'text-emerald-500' };
    };

    const recency = getRecencyInfo(metrics.lastExecuted);
    const scoreColorClass = getScoreColor(score.finalScore);

    return (
        <div
            onClick={onClick}
            className={`bg-slate-800/50 border rounded-lg p-4 transition cursor-pointer group relative overflow-hidden hover:shadow-lg ${scoreColorClass.replace('text-', 'border-').split(' ')[1]}`}
        >
            {/* Background Gradient based on score */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none`} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getChannelColor(combo.canal)}`}>
                            {combo.canal}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-300">{combo.segmento}</span>
                        {combo.promocional && (
                            <>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-[10px] bg-pink-500/10 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20">
                                    {combo.promocional}
                                </span>
                            </>
                        )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-2" title={combo.oferta}>
                        {combo.oferta}
                    </h3>
                </div>

                {/* Score Circle with Tooltip */}
                <Tooltip
                    side="left"
                    content={
                        <div className="w-48">
                            <p className="text-[10px] font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1">Cálculo do Score</p>
                            <div className="space-y-1 text-[10px] text-slate-400">
                                <div className="flex justify-between">
                                    <span>💰 CAC</span>
                                    <span className="text-slate-200">40%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>📈 Conversão</span>
                                    <span className="text-slate-200">40%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>📊 Volume</span>
                                    <span className="text-slate-200">20%</span>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-2 italic">
                                Score 100 = melhor combinação do período
                            </p>
                        </div>
                    }
                >
                    <div className="relative group/score">
                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 ${scoreColorClass}`}>
                            <span className="text-sm font-bold">{Math.round(score.finalScore)}</span>
                        </div>
                        <div className="absolute top-0 right-0 -mr-1 -mt-1 bg-slate-900 rounded-full p-0.5 text-slate-400 opacity-0 group-hover/score:opacity-100 transition-opacity">
                            <Info size={10} />
                        </div>
                    </div>
                </Tooltip>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
                <Tooltip content="Custo de Aquisição Médio das campanhas">
                    <div className="bg-slate-900/50 rounded p-2 text-center group/metric relative cursor-help">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                            <DollarSign size={10} /> CAC
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                            {metrics.avgCAC > 0 ? `R$ ${metrics.avgCAC.toFixed(0)}` : '-'}
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content="Taxa de Conversão Média (Aprovados / Entregues)">
                    <div className="bg-slate-900/50 rounded p-2 text-center group/metric relative cursor-help">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                            <TrendingUp size={10} /> Conv.
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                            {(metrics.avgConversion * 100).toFixed(1)}%
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content="Número total de execuções desta combinação">
                    <div className="bg-slate-900/50 rounded p-2 text-center group/metric relative cursor-help">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                            <Users size={10} /> Vol.
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                            {metrics.totalVolume}
                        </div>
                    </div>
                </Tooltip>
                <Tooltip content="Data da última execução registrada">
                    <div className="bg-slate-900/50 rounded p-2 text-center group/metric relative cursor-help">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
                            <Clock size={10} /> Última
                        </div>
                        <div className={`text-[10px] font-semibold ${recency.color} leading-tight`}>
                            {recency.text}
                        </div>
                    </div>
                </Tooltip>
            </div>

            <div className="space-y-1">
                {insights.slice(0, 2).map((insight, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${insight.type === 'positive' ? 'bg-emerald-500/10 text-emerald-300' :
                        insight.type === 'negative' ? 'bg-red-500/10 text-red-300' :
                            'bg-slate-700/50 text-slate-400'
                        }`}>
                        {insight.type === 'positive' ? <TrendingUp size={10} /> :
                            insight.type === 'negative' ? <TrendingDown size={10} /> :
                                <Minus size={10} />}
                        {insight.text}
                    </div>
                ))}
            </div>
        </div>
    );
};
