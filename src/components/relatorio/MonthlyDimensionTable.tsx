import React, { useMemo } from 'react';
import { formatVariation } from '../../utils/variationDisplay';
import {
  calculateMonthlyVariation,
  MonthlyDimension,
  MonthlyDimensionRow,
  MonthlyMetricKey,
} from '../../utils/monthlyAggregation';

interface MonthlyDimensionTableProps {
  title: string;
  rows: MonthlyDimensionRow[];
  currentMonthKey?: string;
  previousMonthKey?: string;
  dimension: MonthlyDimension;
}

function fmtN(value: number): string {
  return value.toLocaleString('pt-BR');
}

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals).replace('.', ',')}%`;
}

const primaryMetric: MonthlyMetricKey = 'emissoes';

export const MonthlyDimensionTable: React.FC<MonthlyDimensionTableProps> = ({
  title,
  rows,
  currentMonthKey,
  previousMonthKey,
  dimension,
}) => {
  const tableRows = useMemo(() => {
    if (!currentMonthKey) return [];

    const currentRows = rows.filter(row => row.monthKey === currentMonthKey);
    const previousByLabel = new Map(
      rows.filter(row => row.monthKey === previousMonthKey).map(row => [row.label, row]),
    );

    const currentTotal = currentRows.reduce((sum, row) => sum + row[primaryMetric], 0);

    return currentRows
      .map((row) => {
        const previous = previousByLabel.get(row.label);
        const lastThreeRows = rows
          .filter(candidate => candidate.label === row.label && candidate.monthKey <= currentMonthKey)
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
          .slice(0, 3);
        const threeMonthAverage = lastThreeRows.length > 0
          ? lastThreeRows.reduce((sum, candidate) => sum + candidate[primaryMetric], 0) / lastThreeRows.length
          : 0;

        return {
          row,
          previous,
          variation: calculateMonthlyVariation(row[primaryMetric], previous?.[primaryMetric] ?? 0),
          threeMonthAverage,
          participation: currentTotal > 0 ? row[primaryMetric] / currentTotal : 0,
        };
      })
      .sort((a, b) => b.row[primaryMetric] - a.row[primaryMetric]);
  }, [currentMonthKey, previousMonthKey, rows]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {dimension === 'segmento' ? 'Consolidado por segmento' : 'Consolidado por canal'}
          </p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {tableRows.length} {dimension === 'segmento' ? 'segmentos' : 'canais'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="min-w-[180px] px-4 py-3 text-left font-semibold">
                {dimension === 'segmento' ? 'Segmento' : 'Canal'}
              </th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Mês atual (Emissões)</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Mês anterior (Emissões)</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Variação</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Média 3M</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Participação</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Custo/Cartão</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Custo Total</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(({ row, previous, variation, threeMonthAverage, participation }, index) => {
              const display = formatVariation(variation);
              return (
                <tr key={row.label} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{fmtN(row[primaryMetric])}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtN(previous?.[primaryMetric] ?? 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-bold tabular-nums ${display.bg} ${display.border} ${display.color}`}>
                      {display.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtN(Math.round(threeMonthAverage))}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-cyan-700">{fmtPct(participation, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtBRL(row.custoPorCartao)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtBRL(row.custoTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
