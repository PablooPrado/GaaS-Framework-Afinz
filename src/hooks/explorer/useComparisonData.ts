import { useMemo } from 'react';
import { TreeNode, BarChartDataPoint, HeatmapCell, ExplorerMetric } from '../../types/explorer';
import { ActivityRow } from '../../types/activity';
import { format, startOfWeek, differenceInWeeks } from 'date-fns';

function getMetricValue(node: TreeNode, metric: ExplorerMetric): number {
  switch (metric) {
    case 'volume': return node.metrics.baseTotal;
    case 'cartoes': return node.metrics.cartoes;
    case 'cac': return node.metrics.cac;
    case 'custo': return node.metrics.custoTotal;
    default: return 0;
  }
}

export function formatMetricValue(value: number, metric: ExplorerMetric): string {
  switch (metric) {
    case 'volume':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
    case 'cartoes':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
    case 'cac':
      return `R$ ${value.toFixed(2)}`;
    case 'custo':
      return value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${value.toFixed(2)}`;
    default:
      return String(value);
  }
}

interface UseComparisonDataProps {
  selectedNodeIds: string[];
  nodeMap: Map<string, TreeNode>;
  metric: ExplorerMetric;
  allActivities: ActivityRow[];
  periodStart: string; // YYYY-MM-DD
}

interface UseComparisonDataReturn {
  barChartData: BarChartDataPoint[];
  heatmapData: HeatmapCell[];
  maxValue: number;
  average: number;
  weekLabels: string[];
}

export function useComparisonData({
  selectedNodeIds,
  nodeMap,
  metric,
  allActivities,
  periodStart,
}: UseComparisonDataProps): UseComparisonDataReturn {

  const barChartData = useMemo((): BarChartDataPoint[] => {
    // If nothing selected, show all root nodes (BUs)
    const targetIds = selectedNodeIds.length > 0
      ? selectedNodeIds
      : Array.from(nodeMap.values()).filter((n) => n.type === 'bu').map((n) => n.id);

    return targetIds
      .map((id) => {
        const node = nodeMap.get(id);
        if (!node) return null;
        return {
          id: node.id,
          label: node.label,
          value: getMetricValue(node, metric),
          color: node.color,
          count: node.count,
          nodeType: node.type,
        } as BarChartDataPoint;
      })
      .filter((d): d is BarChartDataPoint => d !== null)
      .sort((a, b) => b.value - a.value);
  }, [selectedNodeIds, nodeMap, metric]);

  const { heatmapData, weekLabels } = useMemo(() => {
    const targetIds = selectedNodeIds.length > 0
      ? selectedNodeIds
      : Array.from(nodeMap.values()).filter((n) => n.type === 'bu').map((n) => n.id);

    if (targetIds.length === 0) return { heatmapData: [], weekLabels: [] };

    const periodStartDate = new Date(periodStart + 'T00:00:00');
    const weekSet = new Set<number>();

    // Collect week indices for all activities in selected nodes
    const nodeActivities = new Map<string, ActivityRow[]>();
    for (const id of targetIds) {
      const node = nodeMap.get(id);
      if (!node) continue;
      const actIds = new Set(node.activityIds);
      const acts = allActivities.filter((a) => actIds.has(a.id));
      nodeActivities.set(id, acts);

      for (const a of acts) {
        const d = a['Data de Disparo'];
        if (!d) continue;
        const date = new Date(d + 'T00:00:00');
        const weekIdx = differenceInWeeks(startOfWeek(date), startOfWeek(periodStartDate));
        if (weekIdx >= 0 && weekIdx < 5) weekSet.add(weekIdx);
      }
    }

    const weeks = Array.from(weekSet).sort((a, b) => a - b).slice(0, 4);
    const labels = weeks.map((w) => `S${w + 1}`);

    const cells: HeatmapCell[] = [];
    let maxVal = 0;

    for (const id of targetIds) {
      const node = nodeMap.get(id);
      const acts = nodeActivities.get(id) ?? [];
      if (!node) continue;

      const weekCounts = new Map<number, { count: number; value: number }>();

      for (const a of acts) {
        const d = a['Data de Disparo'];
        if (!d) continue;
        const date = new Date(d + 'T00:00:00');
        const weekIdx = differenceInWeeks(startOfWeek(date), startOfWeek(periodStartDate));
        if (weekIdx < 0 || weekIdx >= 5) continue;

        const existing = weekCounts.get(weekIdx) ?? { count: 0, value: 0 };
        let metricVal = 0;
        switch (metric) {
          case 'volume': metricVal = a['Base Total'] ?? 0; break;
          case 'cartoes': metricVal = a['Cartões Gerados'] ?? 0; break;
          case 'cac': metricVal = a['CAC'] ?? 0; break;
          case 'custo': metricVal = a['Custo Total Campanha'] ?? 0; break;
        }
        weekCounts.set(weekIdx, { count: existing.count + 1, value: existing.value + metricVal });
      }

      for (const weekIdx of weeks) {
        const wData = weekCounts.get(weekIdx) ?? { count: 0, value: 0 };
        if (wData.value > maxVal) maxVal = wData.value;
        cells.push({
          rowId: id,
          rowLabel: node.label,
          columnLabel: `S${weekIdx + 1}`,
          weekIndex: weekIdx,
          value: wData.value,
          intensity: 0, // calculated below
          count: wData.count,
        });
      }
    }

    // Normalize intensities
    for (const cell of cells) {
      cell.intensity = maxVal > 0 ? cell.value / maxVal : 0;
    }

    return { heatmapData: cells, weekLabels: labels };
  }, [selectedNodeIds, nodeMap, allActivities, metric, periodStart]);

  const maxValue = barChartData.length > 0
    ? Math.max(...barChartData.map((d) => d.value))
    : 0;

  const average = barChartData.length > 0
    ? barChartData.reduce((sum, d) => sum + d.value, 0) / barChartData.length
    : 0;

  return { barChartData, heatmapData, maxValue, average, weekLabels };
}
