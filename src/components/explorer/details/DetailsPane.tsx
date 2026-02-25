import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { DetailsPaneData } from '../../../types/explorer';
import { TreeNodeIcon } from '../tree/TreeNodeIcon';
import { PerformanceCard } from './PerformanceCard';
import { ChannelDistribution } from './ChannelDistribution';
import { TopOffersTable } from './TopOffersTable';

interface DetailsPaneProps {
  data: DetailsPaneData | null;
  onClose: () => void;
  onViewAll: () => void;
}

export const DetailsPane: React.FC<DetailsPaneProps> = ({ data, onClose, onViewAll }) => {
  if (!data) {
    return (
      <div className="bg-slate-800/30 rounded-xl p-5 flex items-center justify-center h-full border border-slate-700/30">
        <div className="text-center text-slate-500">
          <p className="text-sm">Selecione um item na árvore</p>
          <p className="text-xs mt-1">para ver detalhes e métricas</p>
        </div>
      </div>
    );
  }

  const { node, period, channelDistribution, topOffers } = data;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 shrink-0">
        <TreeNodeIcon type={node.type} label={node.label} color={node.color} size={15} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{node.label}</p>
          <p className="text-xs text-slate-500">{period}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          aria-label="Fechar painel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        <PerformanceCard metrics={node.metrics} count={node.count} />
        <div className="border-t border-slate-700/50" />
        <ChannelDistribution items={channelDistribution} />
        <div className="border-t border-slate-700/50" />
        <TopOffersTable items={topOffers} />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 shrink-0">
        <button
          onClick={onViewAll}
          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          Ver todos os disparos
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
};
