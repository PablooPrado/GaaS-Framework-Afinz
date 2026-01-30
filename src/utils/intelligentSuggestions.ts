import { Activity } from '../types/activity';

/**
 * =====================================================
 * ENGINE 1:  SUGESTÃO INTELIGENTE BASEADA EM HISTÓRICO
 * =====================================================
 * 
 * Analisa todo o FRAMEWORK histórico e sugere valores para TODOS os campos
 * baseado em probabilidade e frequência de uso.
 */

interface FieldSuggestion {
    value: string | number;
    confidence: number; // 0-100
    frequency: number; // Quantas vezes apareceu no histórico
    label?: string; // Label descritivo
}

interface SuggestionResult {
    field: string;
    suggestions: FieldSuggestion[];
    method: 'exact_match' | 'partial_match' | 'frequency';
}

/**
 * Engine 1: Sugere valores para campos baseado no histórico completo
 * 
 * @param activities - Histórico completo de atividades
 * @param currentFormData - Campos já preenchidos pelo usuário
 * @returns Mapa de sugestões por campo
 */
export function suggestFieldsBasedOnHistory(
    activities: Activity[],
    currentFormData: Record<string, any>
): Record<string, FieldSuggestion[]> {
    const suggestions: Record<string, FieldSuggestion[]> = {};

    // Lista de campos "sugeríveis"
    const suggestibleFields = [
        'parceiro',
        'subgrupo',
        'perfilCredito',
        'oferta',
        'promocional',
        'oferta2',
        'promocional2',
        'produto',
        'etapaAquisicao'
    ];

    suggestibleFields.forEach(field => {
        suggestions[field] = generateSuggestionsForField(
            field,
            activities,
            currentFormData
        );
    });

    return suggestions;
}

function generateSuggestionsForField(
    field: string,
    activities: Activity[],
    currentFormData: Record<string, any>
): FieldSuggestion[] {
    // Mapear campo do form para campo do Activity
    const fieldMap: Record<string, string> = {
        'parceiro': 'Parceiro',
        'subgrupo': 'Subgrupos',
        'perfilCredito': 'Perfil de Crédito',
        'oferta': 'Oferta',
        'promocional': 'Promocional',
        'oferta2': 'Oferta 2',
        'promocional2': 'Promocional 2',
        'produto': 'Produto',
        'etapaAquisicao': 'Etapa de aquisição'
    };

    const activityField = fieldMap[field];
    if (!activityField) return [];

    // Contar frequência de valores
    const valueCounts = new Map<string, number>();
    const contextualMatches = new Map<string, number>();

    activities.forEach(activity => {
        let value = activity[activityField] || activity.raw?.[activityField];
        if (!value) return;

        value = String(value);

        // Contagem geral
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);

        // Contagem contextual (match parcial com campos preenchidos)
        const hasContextMatch =
            (!currentFormData.bu || activity.BU === currentFormData.bu) &&
            (!currentFormData.segmento || activity.Segmento === currentFormData.segmento) &&
            (!currentFormData.jornada || activity.jornada === currentFormData.jornada);

        if (hasContextMatch) {
            contextualMatches.set(value, (contextualMatches.get(value) || 0) + 1);
        }
    });

    // Criar sugestões priorizando matches contextuais
    const allValues = Array.from(new Set([
        ...Array.from(contextualMatches.keys()),
        ...Array.from(valueCounts.keys())
    ]));

    const suggestions: FieldSuggestion[] = allValues
        .map(value => {
            const contextFreq = contextualMatches.get(value) || 0;
            const globalFreq = valueCounts.get(value) || 0;

            // Confidence based em:
            // - Context match peso 70%
            // - Global frequency peso 30%
            const totalContextual = Array.from(contextualMatches.values()).reduce((a, b) => a + b, 0);
            const totalGlobal = valueCounts.size || 1;

            const contextScore = totalContextual > 0 ? (contextFreq / totalContextual) * 70 : 0;
            const globalScore = (globalFreq / totalGlobal) * 30;

            return {
                value,
                confidence: Math.min(100, Math.round(contextScore + globalScore)),
                frequency: globalFreq,
                label: `${value} (usado ${globalFreq}x)`
            };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Top 5 sugestões

    return suggestions;
}

/**
 * =====================================================
 * ENGINE 2: PROJEÇÃO IA COM SIMILARIDADE E DECAIMENTO
 * =====================================================
 * 
 * Busca disparos similares e calcula projeções baseadas em:
 * - Similaridade (BU + Segmento + Perfil + Canal)
 * - Decaimento temporal (últimos 90 dias, mais recente = maior peso)
 * - Médias/medianas ponderadas por volume
 */

export interface ProjectionResult {
    metric: string;
    projectedValue: number;
    confidenceInterval: {
        min: number;
        max: number;
    };
    confidence: number; // 0-100
    sampleSize: number;
    method: 'exact' | 'partial' | 'fallback';
    matchWeight: number; // 100%, 70%, 50%
}

export interface ProjectionInput {
    bu: string;
    segmento: string;
    perfilCredito?: string;
    canal?: string;
    baseVolume?: number;
}

/**
 * Engine 2: Calcula projeções baseadas em similaridade e decaimento temporal
 * 
 * Campos projetáveis:
 * - Volume
 * - Taxa Conversão
 * - Base Acionável
 * - CAC
 * - Taxa Entrega
 * - Taxa Abertura
 * - Propostas
 * - Aprovados
 * - Cartões Gerados
 */
export function calculateProjections(
    activities: Activity[],
    input: ProjectionInput
): Record<string, ProjectionResult> {
    // Filtrar últimos 90 dias
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const recentActivities = activities.filter(a => {
        const dispatchDate = new Date(a['Data de Disparo']);
        return dispatchDate >= cutoffDate;
    });

    // Buscar matches com pesos
    const exactMatches = findExactMatches(recentActivities, input);
    const partialMatches = findPartialMatches(recentActivities, input);
    const fallbackMatches = findFallbackMatches(recentActivities, input);

    let selectedMatches: Activity[];
    let method: 'exact' | 'partial' | 'fallback';
    let matchWeight: number;

    if (exactMatches.length >= 5) {
        selectedMatches = exactMatches;
        method = 'exact';
        matchWeight = 100;
    } else if (partialMatches.length >= 5) {
        selectedMatches = partialMatches;
        method = 'partial';
        matchWeight = 70;
    } else {
        selectedMatches = fallbackMatches;
        method = 'fallback';
        matchWeight = 50;
    }

    // Calcular projeções para cada métrica
    const metrics = [
        'baseVolume',
        'taxaConversao',
        'baseAcionavel',
        'cac',
        'taxaEntrega',
        'taxaAbertura',
        'propostas',
        'aprovados',
        'cartoesGerados'
    ];

    const projections: Record<string, ProjectionResult> = {};

    metrics.forEach(metric => {
        projections[metric] = projectMetric(
            selectedMatches,
            metric,
            method,
            matchWeight,
            input
        );
    });

    return projections;
}

/**
 * Match exato: BU + Segmento + Perfil Crédito + Canal (weight: 100%)
 */
function findExactMatches(activities: Activity[], input: ProjectionInput): Activity[] {
    return activities.filter(a =>
        a.BU === input.bu &&
        a.Segmento === input.segmento &&
        (!input.perfilCredito || a['Perfil de Crédito'] === input.perfilCredito) &&
        (!input.canal || a.Canal === input.canal)
    );
}

/**
 * Match parcial: BU + Segmento (weight: 70%)
 */
function findPartialMatches(activities: Activity[], input: ProjectionInput): Activity[] {
    return activities.filter(a =>
        a.BU === input.bu &&
        a.Segmento === input.segmento
    );
}

/**
 * Fallback: BU apenas (weight: 50%)
 */
function findFallbackMatches(activities: Activity[], input: ProjectionInput): Activity[] {
    return activities.filter(a => a.BU === input.bu);
}

/**
 * Projeta uma métrica específica com decaimento temporal
 */
function projectMetric(
    matches: Activity[],
    metric: string,
    method: 'exact' | 'partial' | 'fallback',
    matchWeight: number,
    input: ProjectionInput
): ProjectionResult {
    // Mapear métricas para campos do Activity
    const metricMap: Record<string, string> = {
        'baseVolume': 'Base Total',
        'taxaConversao': 'Conv % B2C',
        'baseAcionavel': 'Base Total',
        'cac': 'CAC',
        'taxaEntrega': 'Taxa Entrega',
        'taxaAbertura': 'Taxa Abertura',
        'propostas': 'Propostas',
        'aprovados': 'Aprovados',
        'cartoesGerados': 'Cartões'
    };

    const activityField = metricMap[metric];
    const values: Array<{ value: number, weight: number }> = [];

    matches.forEach(activity => {
        let value = activity[activityField] || activity.raw?.[activityField];
        if (value === undefined || value === null) return;

        value = Number(value);
        if (isNaN(value)) return;

        // Calcular decaimento temporal
        const dispatchDate = new Date(activity['Data de Disparo']);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - dispatchDate.getTime()) / (1000 * 60 * 60 * 24));

        // Decaimento linear: 100% para hoje, 50% para 90 dias atrás
        const temporalWeight = Math.max(0.5, 1 - (daysSince / 180));

        // Peso por volume (se aplicável)
        const volumeWeight = activity['Base Total'] ? Math.log10(activity['Base Total'] + 1) / 5 : 1;

        const finalWeight = temporalWeight * volumeWeight;

        values.push({ value, weight: finalWeight });
    });

    if (values.length === 0) {
        return {
            metric,
            projectedValue: 0,
            confidenceInterval: { min: 0, max: 0 },
            confidence: 0,
            sampleSize: 0,
            method,
            matchWeight
        };
    }

    // Cálculos estatísticos
    const projectedValue = calculateWeightedMean(values);
    const standardDev = calculateWeightedStdDev(values, projectedValue);

    // Intervalo de confiança (95% ≈ ±1.96 * stdDev)
    const marginOfError = 1.96 * standardDev;

    // Confidence baseado em tamanho da amostra e peso do match
    const sampleScore = Math.min(100, (values.length / 30) * 100);
    const confidence = Math.round((sampleScore * 0.4) + (matchWeight * 0.6));

    return {
        metric,
        projectedValue: Math.round(projectedValue * 100) / 100,
        confidenceInterval: {
            min: Math.max(0, Math.round((projectedValue - marginOfError) * 100) / 100),
            max: Math.round((projectedValue + marginOfError) * 100) / 100
        },
        confidence,
        sampleSize: values.length,
        method,
        matchWeight
    };
}

/**
 * Média ponderada
 */
function calculateWeightedMean(values: Array<{ value: number, weight: number }>): number {
    const sumWeightedValues = values.reduce((sum, { value, weight }) => sum + (value * weight), 0);
    const sumWeights = values.reduce((sum, { weight }) => sum + weight, 0);
    return sumWeightedValues / sumWeights;
}

/**
 * Desvio padrão ponderado
 */
function calculateWeightedStdDev(
    values: Array<{ value: number, weight: number }>,
    mean: number
): number {
    const sumWeights = values.reduce((sum, { weight }) => sum + weight, 0);
    const variance = values.reduce((sum, { value, weight }) => {
        return sum + weight * Math.pow(value - mean, 2);
    }, 0) / sumWeights;

    return Math.sqrt(variance);
}

/**
 * Mediana ponderada (para métricas que precisam de mediana em vez de média)
 */
export function calculateWeightedMedian(values: Array<{ value: number, weight: number }>): number {
    const sorted = [...values].sort((a, b) => a.value - b.value);
    const totalWeight = sorted.reduce((sum, { weight }) => sum + weight, 0);
    const halfWeight = totalWeight / 2;

    let cumulativeWeight = 0;
    for (const { value, weight } of sorted) {
        cumulativeWeight += weight;
        if (cumulativeWeight >= halfWeight) {
            return value;
        }
    }

    return sorted[sorted.length - 1].value;
}
