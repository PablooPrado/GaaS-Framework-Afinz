import React, { useMemo } from 'react';
import { CalendarData } from '../../types/framework';
import {
  aggregateMonthlyByDimension,
  aggregateMonthlyTotals,
} from '../../utils/monthlyAggregation';
import { MonthlyDimensionTable } from './MonthlyDimensionTable';
import { MonthlyMetricCards } from './MonthlyMetricCards';
import { MonthlyStackedBarChart } from './MonthlyStackedBarChart';

interface MonthlyReportViewProps {
  data: CalendarData;
  selectedBU?: string;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ data, selectedBU }) => {
  const monthlyTotals = useMemo(() => aggregateMonthlyTotals(data), [data]);
  const segmentRows = useMemo(() => aggregateMonthlyByDimension(data, 'segmento'), [data]);
  const channelRows = useMemo(() => aggregateMonthlyByDimension(data, 'canal'), [data]);

  const currentMonth = monthlyTotals[monthlyTotals.length - 1];
  const previousMonth = monthlyTotals[monthlyTotals.length - 2];

  if (monthlyTotals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Nenhum dado mensal disponível para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Consolidação mensal {selectedBU ? `· BU ${selectedBU}` : '· Todas as BUs'}
        </p>
        <h2 className="text-xl font-bold text-slate-900">
          {currentMonth.monthLabel} consolidado
        </h2>
        <p className="text-sm text-slate-500">
          {monthlyTotals.length} mês{monthlyTotals.length !== 1 ? 'es' : ''} no recorte atual
          {previousMonth ? ` · comparação contra ${previousMonth.monthLabel}` : ' · sem mês anterior no recorte'}
        </p>
      </div>

      <MonthlyMetricCards current={currentMonth} previous={previousMonth} />

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <MonthlyStackedBarChart
          title="Evolução mensal por segmento"
          rows={segmentRows}
          dimension="segmento"
        />
        <MonthlyStackedBarChart
          title="Evolução mensal por canal"
          rows={channelRows}
          dimension="canal"
        />
      </div>

      <MonthlyDimensionTable
        title={`Segmentos em ${currentMonth.monthLabel}`}
        rows={segmentRows}
        currentMonthKey={currentMonth.monthKey}
        previousMonthKey={previousMonth?.monthKey}
        dimension="segmento"
      />

      <MonthlyDimensionTable
        title={`Canais em ${currentMonth.monthLabel}`}
        rows={channelRows}
        currentMonthKey={currentMonth.monthKey}
        previousMonthKey={previousMonth?.monthKey}
        dimension="canal"
      />
    </div>
  );
};
