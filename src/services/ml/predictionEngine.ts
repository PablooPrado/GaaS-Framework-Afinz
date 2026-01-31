/**
 * =============================================================================
 * PREDICTION ENGINE
 * =============================================================================
 *
 * Motor de predicoes para metricas de campanhas
 * - Calcula valores projetados baseados em similaridade
 * - Aplica decaimento temporal
 * - Gera intervalos de confianca
 */

import {
    ProcessedActivity,
    ProjectableMetric,
    FieldProjection,
    SimilarityMatch,
    MatchLevel,
    CampaignReference,
    ProjectionMethod,
    FormDataInput,
    CHANNEL_UNIT_COSTS,
    OFFER_UNIT_COSTS
} from './types';
import { calculateMetricStats } from './dataProcessor';
import { calculateConfidenceScore } from './similarityEngine';
import { generateCausalFactors } from './causalAnalyzer';
import { generateExplanation } from './explanationGenerator';

/**
 * Projeta uma metrica baseada em matches similares
 */
export function projectMetric(
    metric: ProjectableMetric,
    matches: SimilarityMatch[],
    matchLevel: MatchLevel,
    formData: FormDataInput,
    allActivities: ProcessedActivity[]
): FieldProjection {
    const activities = matches.map(m => m.activity);

    // Se nao ha matches, retorna projecao vazia
    if (activities.length === 0) {
        return createEmptyProjection(metric);
    }

    // Calcular estatisticas da metrica
    const stats = calculateMetricStats(activities, metric);

    // Determinar metodo de projecao
    const method = determineProjectionMethod(metric, matches, formData);

    // Calcular valor projetado
    let projectedValue = calculateProjectedValue(metric, stats, formData, method);

    // Calcular intervalo de confianca
    const interval = calculateConfidenceInterval(stats, projectedValue);

    // Calcular confianca
    const confidence = calculateConfidenceScore(matches, matchLevel);

    // Gerar fatores causais
    const currentValues = formDataToCurrentValues(formData);
    const causalFactors = generateCausalFactors(allActivities, metric, currentValues);

    // Gerar campanhas similares de referencia
    const similarCampaigns = extractSimilarCampaigns(matches, metric);

    // Gerar explicacao
    const explanation = generateExplanation(
        metric,
        matches.length,
        matchLevel,
        causalFactors,
        stats
    );

    return {
        field: metric,
        projectedValue: roundValue(projectedValue, metric),
        confidence,
        interval: {
            min: roundValue(interval.min, metric),
            max: roundValue(interval.max, metric)
        },
        method,
        explanation,
        similarCampaigns,
        metadata: {
            computedAt: new Date().toISOString(),
            version: '2.0'
        }
    };
}

/**
 * Projeta todas as metricas
 */
export function projectAllMetrics(
    matches: SimilarityMatch[],
    matchLevel: MatchLevel,
    formData: FormDataInput,
    allActivities: ProcessedActivity[]
): Record<ProjectableMetric, FieldProjection> {
    const metrics: ProjectableMetric[] = [
        'volume',
        'taxaConversao',
        'baseAcionavel',
        'cac',
        'taxaEntrega',
        'taxaAbertura',
        'propostas',
        'aprovados',
        'cartoesGerados'
    ];

    const projections: Partial<Record<ProjectableMetric, FieldProjection>> = {};

    metrics.forEach(metric => {
        projections[metric] = projectMetric(
            metric,
            matches,
            matchLevel,
            formData,
            allActivities
        );
    });

    // Aplicar calculos de funil interdependentes
    applyFunnelCalculations(projections as Record<ProjectableMetric, FieldProjection>, formData);

    return projections as Record<ProjectableMetric, FieldProjection>;
}

// =============================================================================
// CALCULOS DE PROJECAO
// =============================================================================

/**
 * Determina metodo de projecao mais apropriado
 */
function determineProjectionMethod(
    metric: ProjectableMetric,
    matches: SimilarityMatch[],
    formData: FormDataInput
): ProjectionMethod {
    // Metricas que se beneficiam de analise causal
    const causalMetrics: ProjectableMetric[] = ['taxaConversao', 'cac', 'taxaAbertura'];

    if (causalMetrics.includes(metric) && matches.length >= 30) {
        return 'causal';
    }

    // Se temos matches exatos ou high
    if (matches.some(m => m.level === 'exact' || m.level === 'high')) {
        return 'correlation';
    }

    // Se temos poucos matches
    if (matches.length < 10) {
        return 'fallback';
    }

    return 'frequency';
}

/**
 * Calcula valor projetado baseado no metodo
 */
function calculateProjectedValue(
    metric: ProjectableMetric,
    stats: ReturnType<typeof calculateMetricStats>,
    formData: FormDataInput,
    method: ProjectionMethod
): number {
    // Metodo base: media ponderada
    let value = stats.weightedMean;

    // Ajustes por metodo
    switch (method) {
        case 'causal':
            // Para metodo causal, usar mediana para maior robustez
            value = stats.median;
            break;

        case 'correlation':
            // Media ponderada com ajuste de recencia
            value = stats.weightedMean;
            break;

        case 'frequency':
            // Usar mediana
            value = stats.median;
            break;

        case 'fallback':
            // Usar media simples com penalidade
            value = stats.mean * 0.8;
            break;
    }

    // Ajustes especificos por metrica
    value = applyMetricSpecificAdjustments(metric, value, formData, stats);

    return Math.max(0, value);
}

/**
 * Aplica ajustes especificos para cada metrica
 */
function applyMetricSpecificAdjustments(
    metric: ProjectableMetric,
    value: number,
    formData: FormDataInput,
    stats: ReturnType<typeof calculateMetricStats>
): number {
    switch (metric) {
        case 'volume':
            // Se o usuario ja informou volume, usar esse
            if (formData.baseVolume && formData.baseVolume > 0) {
                return formData.baseVolume;
            }
            return value;

        case 'baseAcionavel':
            // Base acionavel e proporcional ao volume
            const volume = formData.baseVolume || value;
            const taxaEntregaEstimada = 0.78; // 78% padrao
            return volume * taxaEntregaEstimada;

        case 'cac':
            // CAC nao pode ser zero se temos custo
            if (value === 0 && formData.canal) {
                const custoCanal = CHANNEL_UNIT_COSTS[formData.canal] || 0.01;
                const volume = formData.baseVolume || 10000;
                const cartoesEstimados = volume * 0.02; // 2% conversao
                return (custoCanal * volume) / Math.max(1, cartoesEstimados);
            }
            return value;

        case 'taxaEntrega':
            // Taxa de entrega tem limites logicos
            return Math.min(100, Math.max(0, value));

        case 'taxaAbertura':
            // Taxa de abertura tem limites e depende do canal
            let maxAbertura = 100;
            if (formData.canal === 'E-mail') maxAbertura = 50;
            if (formData.canal === 'SMS') maxAbertura = 80;
            if (formData.canal === 'WhatsApp') maxAbertura = 90;
            return Math.min(maxAbertura, Math.max(0, value));

        case 'taxaConversao':
            // Taxa de conversao raramente passa de 10%
            return Math.min(20, Math.max(0, value));

        default:
            return value;
    }
}

/**
 * Calcula intervalo de confianca (95%)
 */
function calculateConfidenceInterval(
    stats: ReturnType<typeof calculateMetricStats>,
    projectedValue: number
): { min: number; max: number } {
    // Margem de erro baseada no desvio padrao
    const marginOfError = stats.stdDev * 1.96; // 95% CI

    // Se nao temos desvio padrao, usar 20% do valor
    const margin = marginOfError > 0 ? marginOfError : projectedValue * 0.2;

    return {
        min: Math.max(0, projectedValue - margin),
        max: projectedValue + margin
    };
}

/**
 * Aplica calculos de funil interdependentes
 */
function applyFunnelCalculations(
    projections: Record<ProjectableMetric, FieldProjection>,
    formData: FormDataInput
): void {
    const volume = projections.volume.projectedValue || formData.baseVolume || 0;
    const taxaConv = projections.taxaConversao.projectedValue / 100;
    const taxaAprov = 0.65; // Taxa de aprovacao media
    const taxaFinal = 0.85; // Taxa de finalizacao media

    // Recalcular metricas de funil se volume esta definido
    if (volume > 0) {
        // Base Acionavel
        const taxaEntrega = projections.taxaEntrega.projectedValue / 100 || 0.78;
        projections.baseAcionavel.projectedValue = Math.round(volume * taxaEntrega);

        // Propostas
        if (projections.propostas.projectedValue === 0 || taxaConv > 0) {
            projections.propostas.projectedValue = Math.round(volume * taxaConv);
        }

        // Aprovados
        const propostas = projections.propostas.projectedValue;
        if (projections.aprovados.projectedValue === 0 && propostas > 0) {
            projections.aprovados.projectedValue = Math.round(propostas * taxaAprov);
        }

        // Cartoes
        const aprovados = projections.aprovados.projectedValue;
        if (projections.cartoesGerados.projectedValue === 0 && aprovados > 0) {
            projections.cartoesGerados.projectedValue = Math.round(aprovados * taxaFinal);
        }

        // CAC
        if (formData.canal) {
            const custoCanal = CHANNEL_UNIT_COSTS[formData.canal] || 0.01;
            const custoOferta = formData.oferta ? (OFFER_UNIT_COSTS[formData.oferta] || 0) : 0;
            const custoTotal = volume * (custoCanal + custoOferta);
            const cartoes = projections.cartoesGerados.projectedValue;

            if (cartoes > 0) {
                projections.cac.projectedValue = Math.round((custoTotal / cartoes) * 100) / 100;
            }
        }
    }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Cria projecao vazia
 */
function createEmptyProjection(metric: ProjectableMetric): FieldProjection {
    return {
        field: metric,
        projectedValue: 0,
        confidence: 0,
        interval: { min: 0, max: 0 },
        method: 'fallback',
        explanation: {
            summary: 'Sem dados historicos suficientes para projecao',
            causalFactors: [],
            correlationFactors: [],
            timeDecay: 'N/A',
            sampleSize: 0,
            dataQuality: 'low',
            matchLevel: 'fallback',
            matchPercentage: 0
        },
        similarCampaigns: [],
        metadata: {
            computedAt: new Date().toISOString(),
            version: '2.0'
        }
    };
}

/**
 * Extrai campanhas similares para referencia
 */
function extractSimilarCampaigns(
    matches: SimilarityMatch[],
    metric: ProjectableMetric
): CampaignReference[] {
    return matches
        .slice(0, 5)
        .map(match => ({
            id: match.activity.id,
            activityName: match.activity.raw['Activity name / Taxonomia'] || match.activity.id,
            dataDisparo: match.activity.dispatchDate.toISOString().split('T')[0],
            metricValue: match.activity.metrics[metric],
            similarityScore: match.score
        }));
}

/**
 * Converte FormData para mapa de valores atuais
 */
function formDataToCurrentValues(formData: FormDataInput): Record<string, string> {
    const values: Record<string, string> = {};

    if (formData.bu) values['BU'] = formData.bu;
    if (formData.segmento) values['Segmento'] = formData.segmento;
    if (formData.canal) values['Canal'] = formData.canal;
    if (formData.jornada) values['Jornada'] = formData.jornada;
    if (formData.perfilCredito) values['Perfil_Credito'] = formData.perfilCredito;
    if (formData.oferta) values['Oferta'] = formData.oferta;
    if (formData.parceiro) values['Parceiro'] = formData.parceiro;
    if (formData.etapaAquisicao) values['Etapa_Aquisicao'] = formData.etapaAquisicao;

    return values;
}

/**
 * Arredonda valor conforme o tipo de metrica
 */
function roundValue(value: number, metric: ProjectableMetric): number {
    // Metricas inteiras
    const intMetrics: ProjectableMetric[] = [
        'volume', 'baseAcionavel', 'propostas', 'aprovados', 'cartoesGerados'
    ];

    if (intMetrics.includes(metric)) {
        return Math.round(value);
    }

    // CAC com 2 casas decimais
    if (metric === 'cac') {
        return Math.round(value * 100) / 100;
    }

    // Taxas com 2 casas decimais
    return Math.round(value * 100) / 100;
}
