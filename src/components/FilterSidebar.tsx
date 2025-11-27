import React, { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FilterState } from '../types/framework';

interface FilterSidebarProps {
  availableCanais?: string[];
  availableSegmentos?: string[];
  availableParceiros?: string[];
  countByCanal?: { [canal: string]: number };
  countBySegmento?: { [segmento: string]: number };
  countByParceiro?: { [parceiro: string]: number };
}

const BU_COLORS: { [key: string]: string } = {
  B2C: 'bg-blue-500',
  B2B2C: 'bg-emerald-500',
  Plurix: 'bg-purple-500'
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  availableCanais = [],
  availableSegmentos = [],
  availableParceiros = [],
  countByCanal = {},
  countBySegmento = {},
  countByParceiro = {}
}) => {
  const { viewSettings, setGlobalFilters } = useAppStore();
  const filters = viewSettings.filtrosGlobais;

  const [expandedSections, setExpandedSections] = useState({
    bu: true,
    canal: false,
    segmento: false,
    parceiro: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generic toggle helper for array-based filters
  const toggleItem = (field: keyof FilterState, value: string) => {
    const currentList = filters[field] as string[];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];

    setGlobalFilters({ [field]: newList });
  };

  // BU Toggle
  const handleBUToggle = (bu: string) => {
    toggleItem('bu', bu);
  };

  // Select All Helpers
  const toggleAll = (field: keyof FilterState, available: string[]) => {
    const currentList = filters[field] as string[];
    const allSelected = available.every(item => currentList.includes(item));

    if (allSelected) {
      const newList = currentList.filter(item => !available.includes(item));
      setGlobalFilters({ [field]: newList });
    } else {
      const toAdd = available.filter(item => !currentList.includes(item));
      setGlobalFilters({ [field]: [...currentList, ...toAdd] });
    }
  };

  const areAllSelected = (field: keyof FilterState, available: string[]) => {
    const currentList = filters[field] as string[];
    return available.length > 0 && available.every(item => currentList.includes(item));
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 p-6 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🎯 FILTROS
          </h2>
          <div className="h-1 w-12 bg-amber-500 rounded mt-2" />
        </div>

        {/* Date Range Filter */}
        <div className="space-y-3 border-b border-slate-700 pb-4">
          <div className="flex items-center justify-between w-full p-2">
            <p className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Período
            </p>
          </div>
          <div className="space-y-2 px-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Início</label>
              <input
                type="date"
                value={filters.dataInicio || ''}
                onChange={(e) => setGlobalFilters({ dataInicio: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Fim</label>
              <input
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) => setGlobalFilters({ dataFim: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* BU Filter */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('bu')}
            className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
          >
            <p className="text-sm font-semibold text-slate-400 uppercase">Business Unit</p>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.bu ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.bu && (
            <div className="space-y-2 pl-2">
              {/* Todos Button */}
              <button
                onClick={() => toggleAll('bu', ['B2C', 'B2B2C', 'Plurix'])}
                className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('bu', ['B2C', 'B2B2C', 'Plurix'])
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                  }`}
              >
                {areAllSelected('bu', ['B2C', 'B2B2C', 'Plurix']) ? '✓ Todos' : 'Todos'}
              </button>

              {Object.entries(BU_COLORS).map(([bu, color]) => (
                <label key={bu} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                  <input
                    type="checkbox"
                    checked={filters.bu.includes(bu)}
                    onChange={() => handleBUToggle(bu)}
                    className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-slate-300">{bu}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Canal Filter */}
        {availableCanais.length > 0 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleSection('canal')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Canais</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.canal ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.canal && (
              <div className="space-y-2 pl-2">
                <button
                  onClick={() => toggleAll('canais', availableCanais)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('canais', availableCanais)
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {areAllSelected('canais', availableCanais) ? '✓ Todos' : 'Todos'}
                </button>

                {availableCanais.map(canal => (
                  <label key={canal} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={filters.canais.includes(canal)}
                      onChange={() => toggleItem('canais', canal)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm">{canal}</span>
                    <span className="text-slate-500 text-xs ml-auto">({countByCanal[canal] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Segmento Filter */}
        {availableSegmentos.length > 0 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleSection('segmento')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Segmentos</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.segmento ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.segmento && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => toggleAll('segmentos', availableSegmentos)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('segmentos', availableSegmentos)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {areAllSelected('segmentos', availableSegmentos) ? '✓ Todos' : 'Todos'}
                </button>

                {availableSegmentos.map(segmento => (
                  <label key={segmento} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={filters.segmentos.includes(segmento)}
                      onChange={() => toggleItem('segmentos', segmento)}
                      className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-300 text-sm">{segmento}</span>
                    <span className="text-slate-500 text-xs ml-auto">({countBySegmento[segmento] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parceiro Filter */}
        {availableParceiros.length > 0 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleSection('parceiro')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Parceiros</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.parceiro ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.parceiro && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => toggleAll('parceiros', availableParceiros)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('parceiros', availableParceiros)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {areAllSelected('parceiros', availableParceiros) ? '✓ Todos' : 'Todos'}
                </button>

                {availableParceiros.map(parceiro => (
                  <label key={parceiro} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={filters.parceiros.includes(parceiro)}
                      onChange={() => toggleItem('parceiros', parceiro)}
                      className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-slate-300 text-sm">{parceiro}</span>
                    <span className="text-slate-500 text-xs ml-auto">({countByParceiro[parceiro] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Selecione os filtros para refinar a visualização do calendário
          </p>
        </div>
      </div>
    </div>
  );
};
