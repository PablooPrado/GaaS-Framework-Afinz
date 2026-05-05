import React from 'react';
import { formatVariation } from '../../utils/variationDisplay';
import {
  calculateMonthlyVariation,
  MonthlyMetricKey,
  MonthlyTotalRow,
} from '../../utils/monthlyAggregation';

interface MonthlyMetricCardsProps {
  current?: MonthlyTotalRow;
  previous?: MonthlyTotalRow;
}

const cardMetrics: Array<{
  key: MonthlyMetricKey;
  label: string;
  invertPositive?: boolean;
  format: (value: number) => string;
}> = [
  { key: 'baseEnviada', label: 'Base Enviada', format: (value) => value.toLocaleString('pt-BR') },
  { key: 'baseEntregue', label: 'Base Entregue', format: (value) => value.toLocaleString('pt-BR') },
  { key: 'propostas', label: 'Propostas', format: (value) => value.toLocaleString('pt-BR') },
  { key: 'aprovados', label: 'Aprovados', format: (value) => value.toLocaleString('pt-BR') },
  { key: 'emissoes', label: 'Emissões', format: (value) => value.toLocaleString('pt-BR') },
  {
    key: 'custoTotal',
    label: 'Custo Total',
    invertPositive: true,
    format: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    key: 'custoPorCartao',
    label: 'Custo/Cartão',
    invertPositive: true,
    format: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    key: 'taxaConversaoBase',
    label: '% Conv da Base',
    format: (value) => `${(value * 100).toFixed(4).replace('.', ',')}%`,
  },
];

export const MonthlyMetricCards: React.FC<MonthlyMetricCardsProps> = ({ current, previous }) => {
  if (!current) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Nenhum mês disponível para consolidar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cardMetrics.map((metric) => {
        const currentValue = current[metric.key];
        const previousValue = previous?.[metric.key] ?? 0;
        const variation = formatVariation(
          calculateMonthlyVariation(currentValue, previousValue),
          metric.invertPositive,
        );

        return (
          <div key={metric.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{metric.format(currentValue)}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[10px] font-bold tabular-nums ${variation.bg} ${variation.border} ${variation.color}`}>
                {variation.label}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              <span className="text-slate-400">Anterior: </span>
              <span className="tabular-nums">{metric.format(previousValue)}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
};
