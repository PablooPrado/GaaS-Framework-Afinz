import React, { useMemo } from 'react';
import { AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { CalendarData } from '../../types/framework';
import { Tooltip } from '../Tooltip';
import { useBottleneckTrend, FunnelMetrics } from '../../hooks/useBottleneckTrend';

interface BottleneckAnalysisProps {
    data: CalendarData;
    previousData?: CalendarData; // New prop for trend analysis
    selectedBU?: string;
    selectedCanais?: string[];
    selectedSegmentos?: string[];
    selectedParceiros?: string[];
}

interface StageData {
    name: string;
    prevKey: string;
    key: string;
    value: number;
    prevValue: number;
    conversionRate: number;
    drop: number;
    isBottleneck: boolean;
    severity: 'critical' | 'warning' | 'ok';
    trend?: {
        value: number | null;
        direction: 'up' | 'down' | 'stable' | 'none';
    };
}

export const BottleneckAnalysis: React.FC<BottleneckAnalysisProps> = ({
    data,
    previousData,
    selectedBU,
    selectedCanais = [],
    selectedSegmentos = [],
    selectedParceiros = []
}) => {
    const { calcularTendencia } = useBottleneckTrend();

    const calculateMetrics = (dataset: CalendarData): FunnelMetrics => {
        let totalBaseEnviada = 0;
        let totalBaseEntregue = 0;
        let totalPropostas = 0;
        let totalAprovados = 0;
        let totalEmissoes = 0;

        Object.values(dataset).forEach((activities) => {
            activities.forEach((activity) => {
                if (selectedBU && activity.bu !== selectedBU) return;
                if (selectedCanais.length > 0 && !selectedCanais.includes(activity.canal)) return;
                if (selectedSegmentos.length > 0 && !selectedSegmentos.includes(activity.segmento)) return;
                if (selectedParceiros.length > 0 && !selectedParceiros.includes(activity.parceiro)) return;

                totalBaseEnviada += activity.kpis.baseEnviada || 0;
                totalBaseEntregue += activity.kpis.baseEntregue || 0;
                totalPropostas += activity.kpis.propostas || 0;
                totalAprovados += activity.kpis.aprovados || 0;
                totalEmissoes += activity.kpis.emissoes || 0;
            });
        });

        return {
            baseEnviada: totalBaseEnviada,
            baseEntregue: totalBaseEntregue,
            propostas: totalPropostas,
            aprovados: totalAprovados,
            emissoes: totalEmissoes
        };
    };

    const analysis = useMemo(() => {
        const currentMetrics = calculateMetrics(data);
        const previousMetrics = previousData ? calculateMetrics(previousData) : null;

        const trends = calcularTendencia(currentMetrics, previousMetrics);

        const stagesDef = [
            { name: 'Envio → Entrega', key: 'baseEntregue', prevKey: 'baseEnviada' },
            { name: 'Entrega → Abertura', key: 'propostas', prevKey: 'baseEntregue' }, // Using Propostas as proxy for Abertura/Interest
            { name: 'Abertura → Proposta', key: 'aprovados', prevKey: 'propostas' },
            { name: 'Proposta → Emissão', key: 'emissoes', prevKey: 'aprovados' },
        ];

        const result: StageData[] = stagesDef.map((stage) => {
            let prev = 0;
            if (stage.prevKey === 'baseEnviada') prev = currentMetrics.baseEnviada;
            else if (stage.prevKey === 'baseEntregue') prev = currentMetrics.baseEntregue;
            else if (stage.prevKey === 'propostas') prev = currentMetrics.propostas;
            else if (stage.prevKey === 'aprovados') prev = currentMetrics.aprovados;

            let current = 0;
            if (stage.key === 'baseEntregue') current = currentMetrics.baseEntregue;
            else if (stage.key === 'propostas') current = currentMetrics.propostas;
            else if (stage.key === 'aprovados') current = currentMetrics.aprovados;
            else if (stage.key === 'emissoes') current = currentMetrics.emissoes;

            const conversionRate = prev > 0 ? (current / prev) * 100 : 0;
            const drop = prev - current;

            let severity: 'critical' | 'warning' | 'ok' = 'ok';
            if (conversionRate < 10) severity = 'critical';
            else if (conversionRate < 50) severity = 'warning';

            const trendData = trends.find(t => t.etapa === stage.name);

            return {
                name: stage.name,
                prevKey: stage.prevKey,
                key: stage.key,
                value: current,
                prevValue: prev,
                conversionRate,
                drop,
                isBottleneck: severity !== 'ok',
                severity,
                trend: trendData ? { value: trendData.tendencia, direction: trendData.direcao } : undefined
            };
        });

        return result;
    }, [data, previousData, selectedBU, selectedCanais, selectedSegmentos, selectedParceiros]);

    // Find the biggest bottleneck
    const biggestBottleneck = useMemo(() => {
        const bottlenecks = analysis.filter(s => s.isBottleneck);
        if (bottlenecks.length === 0) return null;
        return bottlenecks.reduce((prev, curr) => prev.conversionRate < curr.conversionRate ? prev : curr);
    }, [analysis]);

    const getCausesAndActions = (stageName: string) => {
        switch (stageName) {
            case 'Envio → Entrega':
                return {
                    causes: ['Base desatualizada', 'Blacklist', 'Reputação do IP'],
                    action: 'Higienizar base, verificar reputação'
                };
            case 'Entrega → Abertura':
                return {
                    causes: ['Assunto fraco', 'Horário ruim', 'Remetente desconhecido'],
                    action: 'Teste A/B assunto e horário'
                };
            case 'Abertura → Proposta':
                return {
                    causes: ['Jornada confusa', 'CTA fraco', 'Instabilidade'],
                    action: 'Verificar logs, revisar fluxo no app'
                };
            case 'Proposta → Emissão':
                return {
                    causes: ['Critério restritivo', 'Documentação complexa'],
                    action: 'Revisar política com crédito'
                };
            default:
                return { causes: [], action: '' };
        }
    };

    const renderTrend = (trend?: { value: number | null, direction: 'up' | 'down' | 'stable' | 'none' }) => {
        if (!trend || trend.value === null || trend.direction === 'none') return <span className="text-slate-500">-</span>;

        const { value, direction } = trend;
        if (direction === 'stable') return <span className="text-slate-500 flex items-center"><Minus size={14} className="mr-1" /> {Math.abs(value).toFixed(1)}%</span>;

        const isPositive = direction === 'up';
        const color = isPositive ? 'text-emerald-400' : 'text-red-400';
        const Icon = isPositive ? TrendingUp : TrendingDown;

        return (
            <span className={`${color} flex items-center`}>
                <Icon size={14} className="mr-1" />
                {Math.abs(value).toFixed(1)}%
            </span>
        );
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-400" />
                Análise de Gargalos
                <Tooltip content="Identifica a etapa do funil onde você mais perde volume. O maior gargalo é destacado com causas prováveis e ação. Cores: Verde (>50%), Amarelo (10-50%), Vermelho (<10%)." />
            </h2>

            {biggestBottleneck ? (
                <div className="mb-8 bg-slate-900/50 border border-red-900/50 rounded-lg overflow-hidden">
                    <div className="bg-red-900/20 px-4 py-2 border-b border-red-900/30 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-200 font-bold text-sm uppercase tracking-wider">Maior Gargalo Detectado</span>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-100 mb-1">{biggestBottleneck.name}</h3>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs">Taxa de Conversão</span>
                                    <span className="text-2xl font-bold text-red-400">{biggestBottleneck.conversionRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs">Volume Perdido</span>
                                    <span className="text-2xl font-bold text-slate-200">{biggestBottleneck.drop.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs">Tendência</span>
                                    <span className="text-lg font-bold text-slate-400 flex items-center">
                                        {renderTrend(biggestBottleneck.trend)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-800/50 rounded p-4 border border-slate-700/50">
                                <h4 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
                                    💡 Possíveis Causas
                                </h4>
                                <ul className="space-y-1">
                                    {getCausesAndActions(biggestBottleneck.name).causes.map((cause, idx) => (
                                        <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                                            <span className="text-slate-600 mt-1">•</span>
                                            {cause}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-blue-900/10 rounded p-4 border border-blue-900/30">
                                <h4 className="font-bold text-blue-400 text-sm mb-3 flex items-center gap-2">
                                    🎯 Ação Sugerida
                                </h4>
                                <p className="text-slate-300 text-sm">
                                    {getCausesAndActions(biggestBottleneck.name).action}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-emerald-900/10 border border-emerald-900/30 rounded-lg text-center">
                    <p className="text-emerald-400 font-medium">Nenhum gargalo crítico identificado. O funil está saudável!</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analysis.map((stage, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 transition ${stage.severity === 'critical' ? 'border-red-500 bg-red-500/10' :
                            stage.severity === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                                'border-green-500 bg-green-500/10'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-slate-400">{stage.name}</span>
                        </div>
                        <div className="text-xl font-bold text-slate-200 mb-1">
                            {stage.conversionRate.toFixed(1)}%
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-red-400 flex items-center gap-1">
                                <TrendingDown size={12} />
                                -{stage.drop.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs">
                                {renderTrend(stage.trend)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
