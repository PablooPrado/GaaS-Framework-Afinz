/**
 * =============================================================================
 * INSIGHT GENERATOR - Gerador de Insights
 * =============================================================================
 *
 * Responsabilidades:
 * 1. Classificar tipo de insight (Risk, Opportunity, Anomaly, etc)
 * 2. Calcular severidade/prioridade
 * 3. Gerar explicações em linguagem natural
 * 4. Preparar sugestões acionáveis
 * 5. Ordenar por impacto e relevância
 *
 * Output: Lista de insights com ações sugeridas
 */

import { DispatchFormData, Alternative } from './alternativeGenerator';
import { PerformanceSnapshot, TrendAnalysis } from './performanceAnalyzer';
import { ProjectableMetric } from './types';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export type InsightType =
  | 'RISK_ALERT' // Performance em queda ou setup problemático
  | 'OPPORTUNITY' // Alternativa com alto impacto
  | 'ANOMALY' // Padrão incomum detectado
  | 'QUICK_WIN' // Mudança fácil, alto impacto
  | 'VALIDATION' // Setup validado como bom
  | 'DATA_WARNING'; // Dados insuficientes para decisão

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Insight {
  /** ID único */
  id: string;

  /** Tipo de insight */
  type: InsightType;

  /** Severidade/Prioridade */
  severity: SeverityLevel;

  /** Título breve */
  title: string;

  /** Descrição detalhada */
  description: string;

  /** Explicação técnica (opcional) */
  technicalExplanation?: string;

  /** Ação recomendada */
  recommendedAction: string;

  /** Se há uma alternativa associada */
  relatedAlternative?: Alternative;

  /** Confiança desta recomendação (0-100%) */
  confidence: number;

  /** Dados que fundamentam este insight */
  evidence: string[];

  /** Ícone para UI */
  icon: string;

  /** Cor para UI */
  badgeColor: string;

  /** Prioridade de exibição (1 = mais importante) */
  priority: number;

  /** Se foi aceito/rejeitado pelo usuário */
  userFeedback?: 'accepted' | 'rejected' | 'ignored';
}

// =============================================================================
// INSIGHT GENERATOR
// =============================================================================

export class InsightGenerator {
  /**
   * Gera insights baseado em análises de performance e alternativas
   *
   * @example
   * const insights = generator.generateInsights(
   *   currentSetup,
   *   performanceSnapshot,
   *   alternatives,
   *   trendAnalysis
   * );
   */
  public generateInsights(
    currentSetup: DispatchFormData,
    performance: PerformanceSnapshot,
    alternatives: Alternative[],
    trend: TrendAnalysis
  ): Insight[] {
    const insights: Insight[] = [];

    // 1. Verificar riscos (dados insuficientes, trending down, etc)
    const riskInsights = this.detectRisks(performance, trend, currentSetup);
    insights.push(...riskInsights);

    // 2. Detectar oportunidades
    const opportunityInsights = this.detectOpportunities(alternatives, performance);
    insights.push(...opportunityInsights);

    // 3. Detectar anomalias
    const anomalyInsights = this.detectAnomalies(performance, currentSetup);
    insights.push(...anomalyInsights);

    // 4. Quick wins (oportunidades de fácil implementação e alto impacto)
    const quickWinInsights = this.detectQuickWins(alternatives);
    insights.push(...quickWinInsights);

    // 5. Validações positivas
    if (riskInsights.length === 0 && opportunityInsights.length === 0) {
      const validationInsights = this.generateValidation(performance);
      insights.push(...validationInsights);
    }

    // Ordenar por severidade e prioridade
    insights.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.priority - b.priority;
    });

    return insights;
  }

  // ===========================================================================
  // DETECÇÃO DE RISCOS
  // ===========================================================================

  private detectRisks(performance: PerformanceSnapshot, trend: TrendAnalysis, setup: DispatchFormData): Insight[] {
    const risks: Insight[] = [];

    // Risco 1: Dados insuficientes
    if (performance.sampleSize < 5) {
      risks.push({
        id: 'risk-insufficient-data',
        type: 'DATA_WARNING',
        severity: 'HIGH',
        title: '⚠️ Dados Insuficientes',
        description: `Apenas ${performance.sampleSize} disparos similares encontrados. Recomendações podem ser imprecisas.`,
        technicalExplanation: `Com menos de 5 amostras, o intervalo de confiança é muito amplo. Considere aguardar mais disparos.`,
        recommendedAction: 'Aguarde mais dados ou ajuste os filtros para combinar com mais histórico.',
        confidence: 30,
        evidence: [`Sample size: ${performance.sampleSize}`, `Data quality: ${performance.dataQuality.level}`],
        icon: '⚠️',
        badgeColor: 'bg-yellow-500/20 text-yellow-400',
        priority: 1,
      });
    }

    // Risco 2: Performance em queda
    if (trend.isSignificant && trend.direction === 'down') {
      const monthlyChange = trend.change30days;

      risks.push({
        id: 'risk-declining-performance',
        type: 'RISK_ALERT',
        severity: Math.abs(monthlyChange) > 15 ? 'CRITICAL' : 'HIGH',
        title: '📉 Performance em Queda',
        description: `Taxa de conversão caindo ${Math.abs(trend.change30days).toFixed(1)}% nos últimos 30 dias. Segmento pode estar saturado ou saturação de audience.`,
        technicalExplanation: `Regressão linear detectou slope significativo: ${trend.slope.toFixed(4)}/dia. Projeção para 30 dias: ${trend.projection30days?.toFixed(2)}%.`,
        recommendedAction:
          monthlyChange < -15
            ? 'Parar disparos neste segmento e considerar alternativas'
            : 'Mudar para segmento diferente ou atualizar oferta',
        confidence: Math.min(85, 60 + Math.abs(trend.slope) * 100),
        evidence: [
          `Tendência: ${trend.description}`,
          `Mudança 30d: ${monthlyChange.toFixed(1)}%`,
          `R²: ${trend.rSquared.toFixed(2)}`,
        ],
        icon: '📉',
        badgeColor: 'bg-red-500/20 text-red-400',
        priority: 2,
      });
    }

    // Risco 3: Alta variabilidade
    if (performance.stats.coefficientOfVariation > 0.5) {
      risks.push({
        id: 'risk-high-variance',
        type: 'ANOMALY',
        severity: 'MEDIUM',
        title: '📊 Alta Variabilidade',
        description: `Resultados muito inconsistentes (desvio: ${(performance.stats.coefficientOfVariation * 100).toFixed(0)}%). Difícil prever resultados.`,
        technicalExplanation: `Coeficiente de variação: ${performance.stats.coefficientOfVariation.toFixed(2)}. Indica dados muito barulhentos.`,
        recommendedAction: 'Validar dados, verificar se há mistura de segmentos diferentes ou problemas de rastreamento.',
        confidence: 70,
        evidence: [
          `Variability: ${(performance.stats.coefficientOfVariation * 100).toFixed(0)}%`,
          `Std Dev: ${performance.stats.stdDev.toFixed(2)}`,
          `Outliers: ${performance.stats.outliers.length}`,
        ],
        icon: '📊',
        badgeColor: 'bg-orange-500/20 text-orange-400',
        priority: 3,
      });
    }

    // Risco 4: Outliers significativos
    if (performance.stats.outliers.length > performance.sampleSize * 0.2) {
      risks.push({
        id: 'risk-outliers',
        type: 'ANOMALY',
        severity: 'MEDIUM',
        title: '🎯 Outliers Detectados',
        description: `${performance.stats.outliers.length} valores atípicos encontrados. Resultados podem estar enviesados.`,
        recommendedAction: 'Revisar manualmente disparos com valores extremos. Considerar usar Mediana ao invés de Média.',
        confidence: 75,
        evidence: [
          `Outliers: ${performance.stats.outliers.length}`,
          `Range: ${performance.stats.min.toFixed(2)} - ${performance.stats.max.toFixed(2)}`,
          `Median (sem outliers): ${performance.stats.medianWithoutOutliers.toFixed(2)}`,
        ],
        icon: '🎯',
        badgeColor: 'bg-purple-500/20 text-purple-400',
        priority: 4,
      });
    }

    return risks;
  }

  // ===========================================================================
  // DETECÇÃO DE OPORTUNIDADES
  // ===========================================================================

  private detectOpportunities(alternatives: Alternative[], performance: PerformanceSnapshot): Insight[] {
    const opportunities: Insight[] = [];

    // Filtrar alternativas com melhoria significativa (>10%)
    const significantAlternatives = alternatives.filter((alt) => alt.improvementPercent > 10);

    for (let i = 0; i < Math.min(significantAlternatives.length, 2); i++) {
      const alt = significantAlternatives[i];

      let severity: SeverityLevel;
      if (alt.improvementPercent > 50) {
        severity = 'HIGH';
      } else if (alt.improvementPercent > 30) {
        severity = 'MEDIUM';
      } else {
        severity = 'LOW';
      }

      opportunities.push({
        id: `opportunity-${alt.id}`,
        type: 'OPPORTUNITY',
        severity,
        title: `🚀 ${alt.title}`,
        description: alt.description,
        technicalExplanation: `Alternativa testada em ${alt.sampleCount} disparos similares com ${alt.expectedMetricValue.toFixed(2)}% de taxa esperada.`,
        recommendedAction: `Considerar aplicar esta sugestão: ${alt.displayText}`,
        relatedAlternative: alt,
        confidence: alt.confidence,
        evidence: [
          `Improvement: +${alt.improvementPercent.toFixed(1)}%`,
          `Sample size: ${alt.sampleCount}`,
          `Risk level: ${alt.riskLevel}`,
          `Expected value: ${alt.expectedMetricValue.toFixed(2)}%`,
        ],
        icon: '🚀',
        badgeColor: 'bg-green-500/20 text-green-400',
        priority: i + 5,
      });
    }

    return opportunities;
  }

  // ===========================================================================
  // DETECÇÃO DE ANOMALIAS
  // ===========================================================================

  private detectAnomalies(performance: PerformanceSnapshot, setup: DispatchFormData): Insight[] {
    const anomalies: Insight[] = [];

    // Anomalia 1: Segmento com performance muito alta (possível erro de rastreamento?)
    if (performance.stats.median > 50) {
      anomalies.push({
        id: 'anomaly-too-high',
        type: 'ANOMALY',
        severity: 'MEDIUM',
        title: '⚡ Taxa Anormalmente Alta',
        description: `Taxa de ${performance.stats.median.toFixed(1)}% é muito alta. Verificar se rastreamento está correto.`,
        recommendedAction: 'Revisar implementação do rastreamento. Possível erro em contagem de cartões ou base.',
        confidence: 60,
        evidence: [`Median: ${performance.stats.median.toFixed(2)}%`, `Sample: ${performance.sampleSize}`],
        icon: '⚡',
        badgeColor: 'bg-cyan-500/20 text-cyan-400',
        priority: 10,
      });
    }

    // Anomalia 2: Performance muito baixa
    if (performance.stats.median < 0.5 && performance.sampleSize >= 5) {
      anomalies.push({
        id: 'anomaly-too-low',
        type: 'ANOMALY',
        severity: 'MEDIUM',
        title: '📌 Taxa Muito Baixa',
        description: `Taxa de ${performance.stats.median.toFixed(3)}% é anormalmente baixa. Revisar segmentação ou público.`,
        recommendedAction: 'Validar se segmento está realmente ativo. Considerar mudar para público diferente.',
        confidence: 70,
        evidence: [`Median: ${performance.stats.median.toFixed(4)}%`, `Sample: ${performance.sampleSize}`],
        icon: '📌',
        badgeColor: 'bg-red-500/20 text-red-400',
        priority: 8,
      });
    }

    return anomalies;
  }

  // ===========================================================================
  // DETECÇÃO DE QUICK WINS
  // ===========================================================================

  private detectQuickWins(alternatives: Alternative[]): Insight[] {
    const quickWins: Insight[] = [];

    // Quick wins: alternativas com >15% melhoria E baixo risco
    const winners = alternatives.filter((alt) => alt.improvementPercent > 15 && alt.riskLevel === 'low' && alt.confidence > 70);

    for (let i = 0; i < Math.min(winners.length, 2); i++) {
      const win = winners[i];

      quickWins.push({
        id: `quick-win-${win.id}`,
        type: 'QUICK_WIN',
        severity: 'HIGH',
        title: `⚡ ${win.icon} ${win.displayText}`,
        description: `${win.title}: ${win.improvementPercent.toFixed(0)}% melhor com baixo risco (${win.sampleCount} casos similares).`,
        recommendedAction: `Aplicar agora: ${win.changedField} = ${win.newValue}`,
        relatedAlternative: win,
        confidence: win.confidence,
        evidence: [
          `Low risk: ${win.sampleCount} similar cases`,
          `High confidence: ${win.confidence}%`,
          `Easy to apply`,
        ],
        icon: '⚡',
        badgeColor: 'bg-lime-500/20 text-lime-400',
        priority: 2 + i,
      });
    }

    return quickWins;
  }

  // ===========================================================================
  // GERAÇÃO DE VALIDAÇÕES POSITIVAS
  // ===========================================================================

  private generateValidation(performance: PerformanceSnapshot): Insight[] {
    const validations: Insight[] = [];

    // Validação: Setup parece bom
    if (performance.sampleSize >= 10 && performance.dataQuality.level === 'high') {
      validations.push({
        id: 'validation-good-setup',
        type: 'VALIDATION',
        severity: 'LOW',
        title: '✅ Setup Consolidado',
        description: 'Este setup tem histórico sólido e performance consistente. Seguro para reproduzir.',
        recommendedAction: 'Prosseguir com confiança. Este padrão é bem estabelecido.',
        confidence: 90,
        evidence: [
          `Sample size: ${performance.sampleSize}`,
          `Data quality: ${performance.dataQuality.level}`,
          `Median: ${performance.stats.median.toFixed(2)}%`,
          `Variability: ${(performance.stats.coefficientOfVariation * 100).toFixed(0)}%`,
        ],
        icon: '✅',
        badgeColor: 'bg-green-500/20 text-green-400',
        priority: 20,
      });
    }

    return validations;
  }

  // ===========================================================================
  // MÉTODOS AUXILIARES
  // ===========================================================================

  /**
   * Retorna insight mais relevante por tipo
   */
  public getTopInsightByType(insights: Insight[], type: InsightType): Insight | null {
    const filtered = insights.filter((i) => i.type === type);
    if (filtered.length === 0) return null;

    filtered.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return filtered[0];
  }

  /**
   * Retorna insights com severidade alta ou crítica
   */
  public getCriticalInsights(insights: Insight[]): Insight[] {
    return insights.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH');
  }

  /**
   * Retorna insights com oportunidades de melhoria
   */
  public getOpportunityInsights(insights: Insight[]): Insight[] {
    return insights.filter((i) => i.type === 'OPPORTUNITY' || i.type === 'QUICK_WIN');
  }

  /**
   * Gera resumo em texto para exibição
   */
  public generateSummary(insights: Insight[]): string {
    const critical = insights.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    const opportunities = insights.filter((i) => i.type === 'OPPORTUNITY' || i.type === 'QUICK_WIN');

    let summary = '';

    if (critical.length > 0) {
      summary += `🚨 ${critical.length} alerta(s) importante(s). `;
    }

    if (opportunities.length > 0) {
      summary += `💡 ${opportunities.length} oportunidade(s) de melhoria encontrada(s). `;
    }

    if (critical.length === 0 && opportunities.length === 0) {
      summary = '✅ Setup validado e pronto para disparo.';
    }

    return summary;
  }
}
