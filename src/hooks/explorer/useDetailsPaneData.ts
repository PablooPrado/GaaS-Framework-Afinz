import { useMemo } from 'react';
import { TreeNode, DetailsPaneData, ChannelDistributionItem, TopOfferItem } from '../../types/explorer';
import { ActivityRow } from '../../types/activity';
import { format } from 'date-fns';

const CANAL_COLORS: Record<string, string> = {
  Email: '#60A5FA',
  SMS: '#34D399',
  WhatsApp: '#A78BFA',
  Push: '#FBBF24',
};

export function useDetailsPaneData(
  nodeId: string | null,
  nodeMap: Map<string, TreeNode>,
  allActivities: ActivityRow[],
  filters: { inicio: string; fim: string }
): DetailsPaneData | null {
  return useMemo(() => {
    if (!nodeId) return null;
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const actIdSet = new Set(node.activityIds);
    const activities = allActivities.filter((a) => actIdSet.has(a.id));

    // Channel distribution
    const canalCounts = new Map<string, { count: number; cartoes: number }>();
    for (const a of activities) {
      const canal = a.Canal ?? 'Outro';
      const existing = canalCounts.get(canal) ?? { count: 0, cartoes: 0 };
      canalCounts.set(canal, {
        count: existing.count + 1,
        cartoes: existing.cartoes + (a['Cartões Gerados'] ?? 0),
      });
    }

    const totalCount = activities.length;
    const channelDistribution: ChannelDistributionItem[] = Array.from(canalCounts.entries())
      .map(([canal, { count, cartoes: _c }]) => ({
        canal,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        color: CANAL_COLORS[canal] ?? '#94A3B8',
      }))
      .sort((a, b) => b.count - a.count);

    // Top offers by cartões
    const ofertaCounts = new Map<string, { cartoes: number; count: number }>();
    for (const a of activities) {
      const oferta = a.Oferta;
      if (!oferta) continue;
      const existing = ofertaCounts.get(oferta) ?? { cartoes: 0, count: 0 };
      ofertaCounts.set(oferta, {
        cartoes: existing.cartoes + (a['Cartões Gerados'] ?? 0),
        count: existing.count + 1,
      });
    }

    const topOffers: TopOfferItem[] = Array.from(ofertaCounts.entries())
      .map(([oferta, { cartoes, count }]) => ({ oferta, cartoes, count }))
      .sort((a, b) => b.cartoes - a.cartoes)
      .slice(0, 3);

    // Period label
    const period = `${format(new Date(filters.inicio + 'T00:00:00'), 'MMM yyyy')} – ${format(new Date(filters.fim + 'T00:00:00'), 'MMM yyyy')}`;

    return { node, period, channelDistribution, topOffers, activities };
  }, [nodeId, nodeMap, allActivities, filters]);
}
