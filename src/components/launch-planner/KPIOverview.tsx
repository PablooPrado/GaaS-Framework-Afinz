import React, { useMemo } from 'react';
import { Activity } from '../../types/framework';
import { Info } from 'lucide-react';

import { B2CDataRow } from '../../types/b2c';
import { useAppStore } from '../../store/useAppStore';

interface KPIOverviewProps {
    activities: Activity[];
    previousActivities?: Activity[];
    b2cData?: B2CDataRow[];
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ activities, previousActivities = [], b2cData = [] }) => {
    const { viewSettings } = useAppStore();
    const showB2C = viewSettings.filtrosGlobais.bu.length === 0 || viewSettings.filtrosGlobais.bu.includes('B2C');
    const showCRM = viewSettings.filtrosGlobais.bu.length === 0 || viewSettings.filtrosGlobais.bu.includes('CRM'); // Assuming 'CRM' or standard BU

    const calculateMetrics = (acts: Activity[], b2c: B2CDataRow[] = []) => {
        // CRM Metrics (from Activities)
        let baseEnviada = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.baseEnviada || 0), 0) : 0;
        let baseEntregue = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.baseEntregue || 0), 0) : 0;
        let propostas = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.propostas || 0), 0) : 0;
        let aprovados = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.aprovados || 0), 0) : 0;
        let emissoes = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.emissoes || 0), 0) : 0;
        let custoTotal = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.custoTotal || 0), 0) : 0;
        let cartoes = showCRM ? acts.reduce((sum, a) => sum + (a.kpis?.cartoes || 0), 0);

        // B2C Metrics (from b2cData)
        if (showB2C && b2c.length > 0) {
            baseEnviada += b2c.reduce((sum, d) => sum + (d.qtd_clientes_unicos || 0), 0);
            propostas += b2c.reduce((sum, d) => sum + (d.qtd_propostas || 0), 0);
            aprovados += b2c.reduce((sum, d) => sum + (d.qtd_propostas_aprovadas || 0), 0);
            emissoes += b2c.reduce((sum, d) => sum + (d.qtd_cartoes_emitidos || 0), 0);
            cartoes += b2c.reduce((sum, d) => sum + (d.qtd_cartoes_emitidos || 0), 0);
            custoTotal += b2c.reduce((sum, d) => sum + (d.vlr_investimento_total || 0), 0);
        }

        // ... rates calculation ...

        // Rates
        const taxaEntrega = baseEnviada > 0 ? (baseEntregue / baseEnviada) * 100 : 0;
        const taxaPropostas = baseEntregue > 0 ? (propostas / baseEntregue) * 100 : 0;
        const taxaAprovacao = propostas > 0 ? (aprovados / propostas) * 100 : 0;
        const taxaEmissao = aprovados > 0 ? (emissoes / aprovados) * 100 : 0;
        const cac = cartoes > 0 ? custoTotal / cartoes : 0;
        const convBase = baseEnviada > 0 ? (cartoes / baseEnviada) * 100 : 0;

        return {
            baseEnviada,
            baseEntregue,
            taxaEntrega,
            propostas,
            taxaPropostas,
            aprovados,
            taxaAprovacao,
            emissoes,
            taxaEmissao,
            convBase,
            cac,
            custoTotal
        };
    };

    const currentMetrics = useMemo(() => calculateMetrics(activities, b2cData), [activities, b2cData]);
    const previousMetrics = useMemo(() => calculateMetrics(previousActivities, []), [previousActivities]); // TODO: Pass previousB2CData if comparison needed

    const getVariation = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    const variations = {
        baseEnviada: getVariation(currentMetrics.baseEnviada, previousMetrics.baseEnviada),
        baseEntregue: getVariation(currentMetrics.baseEntregue, previousMetrics.baseEntregue),
        taxaEntrega: currentMetrics.taxaEntrega - previousMetrics.taxaEntrega, // Percentage points for rates
        propostas: getVariation(currentMetrics.propostas, previousMetrics.propostas),
        taxaPropostas: currentMetrics.taxaPropostas - previousMetrics.taxaPropostas,
        aprovados: getVariation(currentMetrics.aprovados, previousMetrics.aprovados),
        taxaAprovacao: currentMetrics.taxaAprovacao - previousMetrics.taxaAprovacao,
        emissoes: getVariation(currentMetrics.emissoes, previousMetrics.emissoes),
        taxaEmissao: currentMetrics.taxaEmissao - previousMetrics.taxaEmissao,
        convBase: currentMetrics.convBase - previousMetrics.convBase,
        cac: getVariation(currentMetrics.cac, previousMetrics.cac),
        custoTotal: getVariation(currentMetrics.custoTotal, previousMetrics.custoTotal)
    };

    const KPICard = ({ label, value, variation, prefix = '', suffix = '', isCurrency = false, highlight = false, decimals = 1 }: any) => (
        <div className={`
            relative rounded-lg p-2 flex flex-col justify-between min-h-[55px] transition-all group
            ${highlight
                ? 'bg-blue-900/20 border border-blue-500/30'
                : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
            }
        `}>
            <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                    {label}
                    <Info size={9} className="cursor-help opacity-40 hover:opacity-100 transition-opacity" />
                </div>
                {variation !== undefined && variation !== 0 && (
                    <span className={`text-[9px] font-bold ${variation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {variation > 0 ? '↑' : '↓'} {Math.abs(variation).toFixed(1)}{suffix === '%' ? 'pp' : '%'}
                    </span>
                )}
            </div>

            <div className="flex flex-col">
                <span className={`text-base font-bold leading-none ${highlight ? 'text-blue-100' : 'text-slate-100'}`}>
                    {prefix}
                    {isCurrency
                        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                        : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
                    }
                    {suffix}
                </span>

                {/* Progress bar for percentage metrics */}
                {suffix === '%' && (
                    <div className="w-full h-0.5 bg-slate-700/50 rounded-full overflow-hidden mt-1">
                        <div
                            className={`h-full rounded-full ${highlight ? 'bg-blue-400' : 'bg-slate-500'}`}
                            style={{ width: `${Math.min(value, 100)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-6 gap-2 mb-2">
            <KPICard label="Base Enviada" value={currentMetrics.baseEnviada} variation={variations.baseEnviada} decimals={0} />
            <KPICard label="Base Entregue" value={currentMetrics.baseEntregue} variation={variations.baseEntregue} decimals={0} />
            <KPICard label="% Entrega" value={currentMetrics.taxaEntrega} suffix="%" variation={variations.taxaEntrega} />
            <KPICard label="Propostas" value={currentMetrics.propostas} variation={variations.propostas} decimals={0} />
            <KPICard label="% Propostas" value={currentMetrics.taxaPropostas} suffix="%" variation={variations.taxaPropostas} />
            <KPICard label="Aprovados" value={currentMetrics.aprovados} variation={variations.aprovados} decimals={0} />

            <KPICard label="% Aprovados" value={currentMetrics.taxaAprovacao} suffix="%" variation={variations.taxaAprovacao} />
            <KPICard label="Emissões" value={currentMetrics.emissoes} variation={variations.emissoes} decimals={0} />
            <KPICard label="% Finalização" value={currentMetrics.taxaEmissao} suffix="%" variation={variations.taxaEmissao} />

            {/* Highlighted Conv. Base */}
            <KPICard
                label="% Conv. Base"
                value={currentMetrics.convBase}
                suffix="%"
                variation={variations.convBase}
                highlight={true}
                decimals={3}
            />

            <KPICard label="CAC" value={currentMetrics.cac} prefix="R$ " isCurrency variation={variations.cac} />
            <KPICard label="Custo Total" value={currentMetrics.custoTotal} prefix="R$ " isCurrency variation={variations.custoTotal} />
        </div>
    );
};
