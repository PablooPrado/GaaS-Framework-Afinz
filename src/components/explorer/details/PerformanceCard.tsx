import React from 'react';
import { NodeMetrics } from '../../../types/explorer';

interface MetricItemProps {
  label: string;
  value: string;
  sub?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, sub }) => (
  <div className="bg-slate-700/40 rounded-lg p-3 flex flex-col gap-0.5">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-lg font-semibold font-mono text-white tabular-nums">{value}</span>
    {sub && <span className="text-xs text-slate-500">{sub}</span>}
  </div>
);

function fmtNum(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtCurrency(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
  return `R$ ${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  if (n === 0) return '—';
  return `${n.toFixed(1)}%`;
}

interface PerformanceCardProps {
  metrics: NodeMetrics;
  count: number;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ metrics, count }) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Performance</p>
    <div className="grid grid-cols-2 gap-2">
      <MetricItem label="Disparos" value={String(count)} />
      <MetricItem label="Cartões" value={fmtNum(metrics.cartoes)} />
      <MetricItem label="CAC médio" value={fmtCurrency(metrics.cac)} />
      <MetricItem label="Custo Total" value={fmtCurrency(metrics.custoTotal)} />
      <MetricItem label="Propostas" value={fmtNum(metrics.propostas)} />
      <MetricItem label="Tx Conversão" value={fmtPct(metrics.taxaConversao)} />
    </div>
  </div>
);
