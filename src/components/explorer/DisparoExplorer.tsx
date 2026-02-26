import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

import { ActivityRow } from '../../types/activity';
import { activityService } from '../../services/activityService';
import { useAppStore } from '../../store/useAppStore';
import { usePeriod } from '../../contexts/PeriodContext';

import { useExplorerStore } from '../../store/explorerStore';
import { useTreeData } from '../../hooks/explorer/useTreeData';
import { useTreeNavigation } from '../../hooks/explorer/useTreeNavigation';
import { useComparisonData } from '../../hooks/explorer/useComparisonData';
import { useDetailsPaneData } from '../../hooks/explorer/useDetailsPaneData';
import { useExplorerSearch } from '../../hooks/explorer/useExplorerSearch';

import { TreeView } from './tree/TreeView';
import { ComparisonPanel } from './comparison/ComparisonPanel';
import { DetailsPane } from './details/DetailsPane';
import { QuickSearch } from './search/QuickSearch';

interface DisparoExplorerProps {
  onNavigateToFramework?: (filters?: { bu?: string; segmento?: string; jornada?: string }) => void;
}

export const DisparoExplorer: React.FC<DisparoExplorerProps> = ({ onNavigateToFramework }) => {
  // ── Dados ──────────────────────────────────────────────────────────────────
  // Usa as atividades já carregadas no store global; faz fetch só se vazio
  const storeActivities = useAppStore((state) => state.activities) as unknown as ActivityRow[];
  const [fetchedActivities, setFetchedActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeActivities.length > 0) return; // store já tem dados, não busca novamente
    let cancelled = false;
    setLoading(true);
    activityService.getAllActivities()
      .then((data) => { if (!cancelled) { setFetchedActivities(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message ?? 'Erro ao carregar atividades'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeActivities.length]);

  const activities: ActivityRow[] = storeActivities.length > 0 ? storeActivities : fetchedActivities;

  // ── Período global ────────────────────────────────────────────────────────
  // Lê do PeriodContext — o mesmo date picker visível no topo da página
  const { startDate, endDate } = usePeriod();
  const periodInicio = format(startDate, 'yyyy-MM-dd');
  const periodFim = format(endDate, 'yyyy-MM-dd');

  // ── Store do Explorer (navegação, seleção, busca) ─────────────────────────
  const {
    filters,
    metric,
    searchQuery,
    selectedNodeIds,
    detailsPaneNodeId,
    setFilters,
    setMetric,
    setSearchQuery,
    deselectAll,
    setDetailsPaneNode,
  } = useExplorerStore();

  // Sincroniza o período do explorerStore com o PeriodContext global
  useEffect(() => {
    setFilters({ periodo: { inicio: periodInicio, fim: periodFim } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodInicio, periodFim]);

  // Build tree
  const { rootNodes, nodeMap, allNodeIds } = useTreeData({ activities, filters });

  // Navigation
  const {
    expandedNodeIds,
    selectedNodeIds: _sel,
    handleToggle,
    handleSelect,
    handleExpandAll,
    handleCollapseAll,
    handleExpandToNode,
    handleKeyDown,
  } = useTreeNavigation(rootNodes, nodeMap);

  // Comparison data
  const { barChartData, heatmapData, weekLabels } = useComparisonData({
    selectedNodeIds,
    nodeMap,
    metric,
    allActivities: activities,
    periodStart: filters.periodo.inicio,
  });

  // Details pane
  const detailsData = useDetailsPaneData(
    detailsPaneNodeId,
    nodeMap,
    activities,
    filters.periodo
  );

  // Search
  const searchResults = useExplorerSearch(nodeMap, searchQuery);

  // "Ver todos disparos" handler
  const handleViewAll = () => {
    if (!detailsData || !onNavigateToFramework) return;
    const { node } = detailsData;
    const filterMap: Record<string, { bu?: string; segmento?: string; jornada?: string }> = {
      bu: { bu: node.label },
      segmento: { segmento: node.label },
      jornada: { jornada: node.label },
      canal: {},
    };
    onNavigateToFramework(filterMap[node.type] ?? {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Carregando atividades...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-400">
          <p className="text-sm font-medium">Erro ao carregar dados</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden">
      {/* LEFT — Tree Panel */}
      <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-hidden">

        {/* Period label — lido do PeriodContext global */}
        <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-slate-400">
            {format(startDate, 'dd MMM', { locale: ptBR })} – {format(endDate, 'dd MMM yyyy', { locale: ptBR })}
          </span>
          <span className="text-xs text-slate-600">{activities.length.toLocaleString('pt-BR')} disparos</span>
        </div>

        {/* Search */}
        <QuickSearch
          query={searchQuery}
          results={searchResults}
          onChange={setSearchQuery}
          onSelect={(nodeId) => {
            handleExpandToNode(nodeId);
            setSearchQuery('');
          }}
          onClear={() => setSearchQuery('')}
        />

        {/* Tree */}
        <div className="flex-1 overflow-y-auto bg-slate-800/30 rounded-xl border border-slate-700/40 p-2">
          <TreeView
            rootNodes={rootNodes}
            onToggle={handleToggle}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        </div>

        {/* Stats footer — mostra contagem no período ativo */}
        <div className="text-xs text-slate-600 text-center">
          {rootNodes.length} BUs · {rootNodes.reduce((s, n) => s + n.count, 0).toLocaleString('pt-BR')} disparos no período
        </div>
      </aside>

      {/* CENTER + RIGHT — Main Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
        {/* Top: Comparison Panel */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-800/20 rounded-xl border border-slate-700/30 p-4">
          <ComparisonPanel
            barChartData={barChartData}
            heatmapData={heatmapData}
            weekLabels={weekLabels}
            metric={metric}
            onMetricChange={setMetric}
            onBarClick={(nodeId) => {
              handleExpandToNode(nodeId);
            }}
          />
        </div>

        {/* Bottom: Details Pane */}
        <div className="h-72 shrink-0">
          <DetailsPane
            data={detailsData}
            onClose={() => { deselectAll(); setDetailsPaneNode(null); }}
            onViewAll={handleViewAll}
          />
        </div>
      </div>
    </div>
  );
};
