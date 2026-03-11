import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyTowerPoint, ExplorerMetric, TemporalViewMode } from '../../../types/explorer';
import { formatMetricValue } from '../../../hooks/explorer/useComparisonData';

interface DailyTowerChartProps {
  mode: TemporalViewMode;
  metric: ExplorerMetric;
  simpleData: DailyTowerPoint[];
  stackedData: DailyTowerPoint[];
  stackedKeys: string[];
  onBarClick?: (date: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

export const DailyTowerChart: React.FC<DailyTowerChartProps> = ({
  mode,
  metric,
  simpleData,
  stackedData,
  stackedKeys,
  onBarClick,
}) => {
  const data = mode === 'simple' ? simpleData : stackedData;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-500">
        Sem dados diários para o período.
      </div>
    );
  }

  const chartWidth = Math.max(900, data.length * 28);

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ width: chartWidth, height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 6 }}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
            onClick={(e: { activePayload?: { payload: DailyTowerPoint }[] } | null) => {
              if (onBarClick && e?.activePayload?.[0]) {
                onBarClick(e.activePayload[0].payload.date);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMetricValue(Number(v), metric)}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatMetricValue(Number(value), metric), name]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            {mode === 'simple' ? (
              <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            ) : (
              stackedKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} stackId="daily" fill={COLORS[idx % COLORS.length]} radius={idx === stackedKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
