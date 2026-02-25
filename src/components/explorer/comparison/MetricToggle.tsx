import React from 'react';
import { ExplorerMetric } from '../../../types/explorer';

const OPTIONS: { value: ExplorerMetric; label: string }[] = [
  { value: 'cartoes', label: 'Cartões' },
  { value: 'volume', label: 'Volume' },
  { value: 'custo', label: 'Custo' },
  { value: 'cac', label: 'CAC' },
];

interface MetricToggleProps {
  value: ExplorerMetric;
  onChange: (metric: ExplorerMetric) => void;
}

export const MetricToggle: React.FC<MetricToggleProps> = ({ value, onChange }) => (
  <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
    {OPTIONS.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={[
          'px-3 py-1 text-xs font-medium rounded-md transition-all',
          value === opt.value
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200',
        ].join(' ')}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
