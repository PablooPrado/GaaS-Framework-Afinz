import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const InfluenceMatrix: React.FC = () => {
    // Mock Data for Influence Dimensions
    const data = [
        { subject: 'Volume (Impacto)', meta: 120, google: 110, fullMark: 150 },
        { subject: 'Eficiência (CPA)', meta: 98, google: 130, fullMark: 150 },
        { subject: 'Qualidade (Aprov.)', meta: 86, google: 130, fullMark: 150 },
        { subject: 'Engajamento', meta: 99, google: 100, fullMark: 150 },
        { subject: 'Consistência', meta: 85, google: 90, fullMark: 150 },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4">

            {/* Chart Section */}
            <div className="w-full md:w-1/2 h-80 relative bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                <h4 className="absolute top-4 left-4 text-sm font-bold text-slate-400">Score de Influência</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Meta Ads"
                            dataKey="meta"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="#3b82f6"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="Google Ads"
                            dataKey="google"
                            stroke="#a855f7"
                            strokeWidth={3}
                            fill="#a855f7"
                            fillOpacity={0.3}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Insights Section */}
            <div className="w-full md:w-1/2 space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-blue-400">Meta Ads</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">Score: 88/100</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Forte em <strong>Volume</strong> e <strong>Engajamento</strong>. Ótimo para topo de funil e gerar demanda inicial.
                        <br />
                        <span className="text-xs text-slate-500 mt-2 block">🚩 Atenção: Qualidade de aprovação abaixo da média.</span>
                    </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-purple-400">Google Ads</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold">Score: 92/100</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Líder em <strong>Eficiência</strong> e <strong>Qualidade</strong>. Tráfego de alta intenção converte melhor em cartões aprovados.
                        <br />
                        <span className="text-xs text-slate-500 mt-2 block">✨ Destaque: Melhor custo por cartão emitido.</span>
                    </p>
                </div>
            </div>

        </div>
    );
};
