import React from 'react';
import { ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ActionLevers: React.FC = () => {
    // Mock Recommendations
    const recommendations = [
        {
            type: 'opportunity',
            title: 'Escalar Google Ads (Campanha Institucional)',
            impact: 'Alto',
            description: 'Eficiência de CPA está 25% acima da meta. Aumentar orçamento em R$ 5k/semana pode trazer +120 cartões.',
            actionLabel: 'Simular Aumento',
            icon: <TrendingUp className="text-emerald-400" size={20} />,
            color: 'border-emerald-500/30 bg-emerald-500/5'
        },
        {
            type: 'warning',
            title: 'Atenção: Queda de Aprovação no Meta',
            impact: 'Médio',
            description: 'Taxa de aprovação caiu para 12%. Revisar segmentação de público para evitar leads desqualificados.',
            actionLabel: 'Ver Detalhes',
            icon: <AlertTriangle className="text-yellow-400" size={20} />,
            color: 'border-yellow-500/30 bg-yellow-500/5'
        },
        {
            type: 'check',
            title: 'Parceiro "Azul" Estável',
            impact: 'Baixo',
            description: 'Volume e custo dentro do esperado. Manter estratégia atual.',
            headingColor: 'text-slate-400',
            icon: <CheckCircle2 className="text-blue-400" size={20} />,
            color: 'border-blue-500/30 bg-blue-500/5'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
                <div key={i} className={`p-5 rounded-xl border ${rec.color} transition-all hover:scale-[1.02] cursor-pointer group`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                            {rec.icon}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${rec.impact === 'Alto' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                rec.impact === 'Médio' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    'bg-slate-700 text-slate-400 border border-slate-600'
                            }`}>
                            Impacto {rec.impact}
                        </span>
                    </div>

                    <h4 className={`text-sm font-bold text-slate-200 mb-2 group-hover:text-white transition-colors`}>{rec.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {rec.description}
                    </p>

                    <div className="flex items-center gap-1 text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span>{rec.actionLabel || 'Analisar'}</span>
                        <ArrowUpRight size={14} />
                    </div>
                </div>
            ))}
        </div>
    );
};
