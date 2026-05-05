import React, { useMemo } from 'react';
import { formatVariation } from '../../utils/variationDisplay';
import {
  calculateMonthlyVariation,
  MonthlyDimension,
  MonthlyDimensionRow,
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

function fmtPct4(value: number): string {
  return `${(value * 100).toFixed(4).replace('.', ',')}%`;
}

const primaryMetric = 'emissoes';

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

        const trendRows = [...lastThreeRows].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
        const maxTrendValue = Math.max(...trendRows.map(candidate => candidate[primaryMetric]), 1);

        return {
          row,
          previous,
          variation: calculateMonthlyVariation(row[primaryMetric], previous?.[primaryMetric] ?? 0),
          cacVariation: calculateMonthlyVariation(row.custoPorCartao, previous?.custoPorCartao ?? 0),
          threeMonthAverage,
          trendRows,
          maxTrendValue,
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
              <th className="min-w-[210px] px-4 py-3 text-right font-semibold whitespace-nowrap">Resultado mensal</th>
              <th className="min-w-[160px] px-4 py-3 text-right font-semibold whitespace-nowrap">Tendência 3M</th>
              <th className="min-w-[170px] px-4 py-3 text-right font-semibold whitespace-nowrap">Funil</th>
              <th className="min-w-[180px] px-4 py-3 text-right font-semibold whitespace-nowrap">Eficiência</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">% Conv da Base</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Participação</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(({ row, previous, variation, cacVariation, threeMonthAverage, trendRows, maxTrendValue, participation }, index) => {
              const display = formatVariation(variation);
              const cacDisplay = formatVariation(cacVariation, true);
              return (
                <tr key={row.label} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="text-base font-bold tabular-nums text-slate-900">{fmtN(row[primaryMetric])}</span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-bold tabular-nums ${display.bg} ${display.border} ${display.color}`}>
                          {display.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        anterior: <span className="tabular-nums text-slate-600">{fmtN(previous?.[primaryMetric] ?? 0)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex h-9 items-end gap-1">
                        {trendRows.map((trend) => (
                          <div
                            key={trend.monthKey}
                            className="w-4 rounded-t bg-cyan-500/80"
                            style={{ height: `${Math.max(4, (trend[primaryMetric] / maxTrendValue) * 36)}px` }}
                            title={`${trend.monthLabel}: ${fmtN(trend[primaryMetric])}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        média: <span className="tabular-nums text-slate-600">{fmtN(Math.round(threeMonthAverage))}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span className="font-semibold tabular-nums text-slate-800">
                        {fmtN(row.propostas)} prop. / {fmtN(row.aprovados)} aprov.
                      </span>
                      <span className="text-[11px] text-slate-500">
                        aprovação: <span className="tabular-nums">{fmtPct(row.taxaAprovacao)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold tabular-nums text-slate-800">{fmtBRL(row.custoPorCartao)}</span>
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${cacDisplay.bg} ${cacDisplay.border} ${cacDisplay.color}`}>
                          {cacDisplay.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        custo total: <span className="tabular-nums">{fmtBRL(row.custoTotal)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">{fmtPct4(row.taxaConversaoBase)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-cyan-700">{fmtPct(participation, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
