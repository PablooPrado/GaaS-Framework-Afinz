import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { useDispatchForm } from '../context/DispatchFormContext';
import { MetricCard } from './shared';

/**
 * Bloco 5: Painel de Projecao IA
 * Exibe 9 metricas projetadas:
 * 1. Volume
 * 2. Taxa Conversao
 * 3. Base Acionavel
 * 4. CAC
 * 5. Taxa Entrega
 * 6. Taxa Abertura
 * 7. Propostas
 * 8. Aprovados
 * 9. Cartoes Gerados
 *
 * Largura: 280px
 */
export const AIProjectionBlock: React.FC = () => {
    const { projections, formData } = useDispatchForm();

    // Calculo de metricas derivadas
    const volumeValue = projections.baseVolume?.projectedValue || Number(formData.baseVolume) || 0;
    const taxaConv = projections.taxaConversao?.projectedValue || 0;
    const baseAcionavel = projections.baseAcionavel?.projectedValue || (volumeValue * 0.78);

    // Calculos de funil
    const propostas = projections.propostas?.projectedValue || (volumeValue * (taxaConv / 100));
    const aprovados = projections.aprovados?.projectedValue || (propostas * 0.65);
    const cartoes = projections.cartoesGerados?.projectedValue || (aprovados * 0.85);

    // CAC
    const custoTotal = Number(formData.custoTotalCampanha) || 0;
    const cacCalculado = cartoes > 0 ? custoTotal / cartoes : 0;
    const cacValue = projections.cac?.projectedValue || cacCalculado;

    // Sample size
    const sampleSize = projections.taxaConversao?.sampleSize || 0;

    return (
        <div className="w-full h-full">
            <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-500/20 shadow-sm flex flex-col h-full hover:border-indigo-500/40 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20 mb-3">
                    <h3 className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <TrendingUp size={14} />
                        Projecao IA
                        <Sparkles size={10} className="text-indigo-300/50" />
                    </h3>
                    <span className="px-1 py-0.5 bg-indigo-500/10 rounded text-[8px] text-indigo-400 font-bold">
                        5
                    </span>
                </div>

                {/* Grid de Metricas - 3x3 */}
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {/* Linha 1: Volume, Taxa Conv, Base Acionavel */}
                    <MetricCard
                        label="Volume"
                        value={volumeValue > 0 ? volumeValue : undefined}
                        isInt
                        confidence={projections.baseVolume?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Tx Conv"
                        value={taxaConv > 0 ? taxaConv : undefined}
                        suffix="%"
                        confidence={projections.taxaConversao?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Bs Acion."
                        value={baseAcionavel > 0 ? baseAcionavel : undefined}
                        isInt
                        confidence={projections.baseAcionavel?.confidence}
                        compact
                    />

                    {/* Linha 2: CAC, Taxa Entrega, Taxa Abertura */}
                    <MetricCard
                        label="CAC"
                        value={cacValue > 0 ? cacValue : undefined}
                        prefix="R$"
                        confidence={projections.cac?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Tx Entreg"
                        value={projections.taxaEntrega?.projectedValue}
                        suffix="%"
                        confidence={projections.taxaEntrega?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Tx Abert"
                        value={projections.taxaAbertura?.projectedValue}
                        suffix="%"
                        confidence={projections.taxaAbertura?.confidence}
                        compact
                    />

                    {/* Linha 3: Propostas, Aprovados, Cartoes */}
                    <MetricCard
                        label="Propostas"
                        value={propostas > 0 ? propostas : undefined}
                        isInt
                        confidence={projections.propostas?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Aprovados"
                        value={aprovados > 0 ? aprovados : undefined}
                        isInt
                        confidence={projections.aprovados?.confidence}
                        compact
                    />
                    <MetricCard
                        label="Cartoes"
                        value={cartoes > 0 ? cartoes : undefined}
                        isInt
                        confidence={projections.cartoesGerados?.confidence}
                        compact
                    />
                </div>

                {/* Footer - Sample Size */}
                <div className="mt-3 text-[8px] text-indigo-400/50 text-center border-t border-indigo-500/10 pt-2">
                    {sampleSize > 0 ? (
                        <>Baseado em <span className="font-bold text-indigo-400">{sampleSize}</span> disparos similares</>
                    ) : (
                        <>Preencha BU e Segmento para projecoes</>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIProjectionBlock;
