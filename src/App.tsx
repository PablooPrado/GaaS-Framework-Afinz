import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { CSVUpload } from './components/CSVUpload';
import { FilterSidebar } from './components/FilterSidebar';
import { Calendar } from './components/Calendar';
import { ResultadosView } from './components/ResultadosView';
import { JornadaDisparosView } from './components/JornadaDisparosView';
import { DiarioBordo } from './components/DiarioBordo';
import { FrameworkView } from './components/FrameworkView';
import { OrientadorView } from './components/OrientadorView';
import { useFrameworkData } from './hooks/useFrameworkData';
import { useAdvancedFilters } from './hooks/useAdvancedFilters';
import { useCalendarFilter } from './hooks/useCalendarFilter';
import { useResultadosMetrics } from './hooks/useResultadosMetrics';
import { useAppStore } from './store/useAppStore';
import './App.css';

function App() {
  const { viewSettings, setTab } = useAppStore();
  const filters = viewSettings.filtrosGlobais;
  const activeTab = viewSettings.abaAtual;

  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const { data, loading, error, totalActivities, processCSV } = useFrameworkData();

  // These hooks now use the new FilterState structure
  const { filteredData: advancedFilteredData, availableCanais, availableSegmentos, availableParceiros, countByCanal, countBySegmento, countByParceiro } = useAdvancedFilters(data, filters);
  const { filteredData, activityCountByDay, getDominantBU, getTotalActivities } = useCalendarFilter(advancedFilteredData, filters);
  const resultados = useResultadosMetrics(filteredData);

  const hasData = Object.keys(data).length > 0;

  console.log('App render - hasData:', hasData, 'totalActivities:', totalActivities);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#060621] to-[#0F172A]">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-[#060621] to-[#0F172A] border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-300"
            title="Toggle Filters"
          >
            {showFiltersDrawer ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-bold text-slate-100">🧠 Growth Brain Afinz</h1>
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-mono">
            {hasData ? (
              <>Atividades: <span className="text-amber-400 font-bold">{getTotalActivities}</span></>
            ) : (
              <span className="invisible">Atividades: 0</span>
            )}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Filters Sidebar - Fixed */}
        {showFiltersDrawer && (
          <>
            <div className="w-80 bg-gradient-to-br from-[#060621] to-[#0F172A] border-r border-slate-700 overflow-y-auto shadow-lg fixed left-0 top-14 bottom-0 z-40">
              <div className="p-4">
                <FilterSidebar
                  availableCanais={availableCanais}
                  availableSegmentos={availableSegmentos}
                  availableParceiros={availableParceiros}
                  countByCanal={countByCanal}
                  countBySegmento={countBySegmento}
                  countByParceiro={countByParceiro}
                />
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              </div>
            </div>
          </>
        )}

        {/* Content area - Scrollável */}
        <div className={`flex-1 flex flex-col overflow-auto transition-all ${showFiltersDrawer ? 'ml-80' : 'ml-0'}`}>
          {!hasData && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {!loading && (
                <div>
                  <CSVUpload onFileSelect={processCSV} loading={loading} error={error} totalActivities={totalActivities} />
                  <div className="text-center mt-8 text-slate-400">
                    <p className="text-sm">Faça upload do Framework CSV para começar</p>
                  </div>
                </div>
              )}
              {loading && (
                <div className="text-slate-400">Carregando...</div>
              )}
            </div>
          )}

          {hasData && (
            <>
              {/* Tabs */}
              <div className="bg-gradient-to-br from-[#060621] to-[#0F172A] border-b border-slate-700 px-4 flex gap-2 shrink-0">
                <button
                  onClick={() => setTab('launch')}
                  className={`py-2 px-3 text-sm font-medium transition border-b-2 ${activeTab === 'launch'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                >
                  🚀 Launch Planner
                </button>
                <button
                  onClick={() => setTab('jornada')}
                  className={`py-2 px-3 text-sm font-medium transition border-b-2 ${activeTab === 'jornada'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                >
                  📈 Jornada & Disparos
                </button>
                <button
                  onClick={() => setTab('resultados')}
                  className={`py-2 px-3 text-sm font-medium transition border-b-2 ${activeTab === 'resultados'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                >
                  📊 Resultados
                </button>
                <button
                  onClick={() => setTab('orientador')}
                  className={`py-2 px-3 text-sm font-medium transition border-b-2 ${activeTab === 'orientador'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                >
                  💡 Orientador
                </button>
                <button
                  onClick={() => setTab('framework')}
                  className={`py-2 px-3 text-sm font-medium transition border-b-2 ${activeTab === 'framework'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                >
                  📋 Framework
                </button>
                <button
                  onClick={() => setTab('diario')}
                  className={`py-2 px-3 text-sm font-medium transition border-b-2 ${activeTab === 'diario'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                >
                  📔 Diário de Bordo
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'launch' && (
                  <Calendar
                    data={filteredData}
                    activityCountByDay={activityCountByDay}
                    getDominantBU={getDominantBU}
                    filters={filters}
                  />
                )}
                {activeTab === 'resultados' && (
                  <div className="p-4 overflow-auto h-full">
                    <ResultadosView
                      resultados={resultados}
                      data={filteredData}
                      selectedBU={filters.bu.length === 1 ? filters.bu[0] : undefined}
                    />
                  </div>
                )}
                {activeTab === 'jornada' && (
                  <div className="overflow-auto h-full">
                    <JornadaDisparosView
                      data={filteredData}
                      selectedBU={filters.bu.length === 1 ? filters.bu[0] : undefined}
                      selectedCanais={filters.canais}
                      selectedSegmentos={filters.segmentos}
                      selectedParceiros={filters.parceiros}
                    />
                  </div>
                )}
                {activeTab === 'diario' && (
                  <DiarioBordo />
                )}
                {activeTab === 'framework' && (
                  <div className="h-full overflow-hidden">
                    <FrameworkView />
                  </div>
                )}

                {activeTab === 'orientador' && (
                  <OrientadorView />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
