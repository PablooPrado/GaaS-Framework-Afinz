import React from 'react';
import {
  BarChartDataPoint,
  DailyTowerPoint,
  DistributionLevel,
  ExplorerMetric,
  TemporalViewMode
} from '../../../types/explorer';
import { MetricToggle } from './MetricToggle';
import { SegmentBarChart } from './SegmentBarChart';
import { DailyTowerChart } from './DailyTowerChart';

interface ComparisonPanelProps {
  barChartData: BarChartDataPoint[];
  distributionLevel: DistributionLevel;
  drillPath: string[];
  dailySimpleData: DailyTowerPoint[];
  dailyStackedData: DailyTowerPoint[];
  stackedKeys: string[];
  metric: ExplorerMetric;
  onMetricChange: (metric: ExplorerMetric) => void;
  onBarClick: (focusId: string | null) => void;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  barChartData,
  distributionLevel,
  drillPath,
  dailySimpleData,
  dailyStackedData,
  stackedKeys,
  metric,
  onMetricChange,
  onBarClick,
}) => {
  const [temporalMode, setTemporalMode] = React.useState<TemporalViewMode>('simple');

  const distributionLabel = distributionLevel === 'bu'
    ? 'Distribuidor por BU'
    : distributionLevel === 'segmento'
      ? 'Distribuidor por Segmento'
      : distributionLevel === 'canal'
        ? 'Distribuidor por Canal'
        : 'Distribuidor por Disparo';

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
          Comparação Visual
        </h3>
        <MetricToggle value={metric} onChange={onMetricChange} />
      </div>

      {drillPath.length > 0 && (
        <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          {drillPath.join(' > ')}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 shadow-sm">
        <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">{distributionLabel}</p>
        <SegmentBarChart data={barChartData} metric={metric} onBarClick={onBarClick} />
      </div>

      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Concentração Temporal Diária</p>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1">
            <button
              onClick={() => setTemporalMode('simple')}
              className={`px-2 py-1 text-[11px] rounded ${temporalMode === 'simple' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Simples
            </button>
            <button
              onClick={() => setTemporalMode('stacked')}
              className={`px-2 py-1 text-[11px] rounded ${temporalMode === 'stacked' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Empilhado
            </button>
          </div>
        </div>
        <DailyTowerChart
          mode={temporalMode}
          metric={metric}
          simpleData={dailySimpleData}
          stackedData={dailyStackedData}
          stackedKeys={stackedKeys}
        />
      </div>
    </div>
  );
};
