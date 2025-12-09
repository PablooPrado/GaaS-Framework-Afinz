import { useState, useMemo } from 'react';
import { Menu, X } from 'lucide-react';
import { CSVUpload } from './components/CSVUpload';
import { FilterSidebar } from './components/FilterSidebar';

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
import { usePeriod } from './contexts/PeriodContext';
import { useBU } from './contexts/BUContext';
import { format } from 'date-fns';
import { GlobalHeader } from './components/layout/GlobalHeader';
import { Sidebar } from './components/layout/Sidebar';
import { LaunchPlanner } from './components/launch-planner/LaunchPlanner';
import { PageHeader } from './components/layout/PageHeader';
import './App.css';

function App() {
  const {
    viewSettings,
    updateActivity
  } = useAppStore();
  const storeFilters = viewSettings.filtrosGlobais;
  const activeTab = viewSettings.abaAtual;

  const { startDate, endDate } = usePeriod();
  const { selectedBUs } = useBU();

  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const { data, loading, error, totalActivities, processCSV, loadSimulatedData } = useFrameworkData();

  // Combine store filters with Context filters
  const filters = useMemo(() => ({
    ...storeFilters,
    dataInicio: format(startDate, 'yyyy-MM-dd'),
    dataFim: format(endDate, 'yyyy-MM-dd'),
    bu: selectedBUs
  }), [storeFilters, startDate, endDate, selectedBUs]);

  // These hooks now use the new FilterState structure
  const { filteredData: advancedFilteredData, availableCanais, availableSegmentos, availableParceiros, countByCanal, countBySegmento, countByParceiro } = useAdvancedFilters(data, filters);
  const { filteredData } = useCalendarFilter(advancedFilteredData, filters);

  // Calculate previous period filters for trend analysis
  const previousFilters = useMemo(() => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);

    return {
      ...filters,
      dataInicio: format(prevStart, 'yyyy-MM-dd'),
      dataFim: format(prevEnd, 'yyyy-MM-dd')
    };
  }, [filters, startDate, endDate]);

  // Filters for Launch Planner (ignoring date range to allow local navigation)
  const launchPlannerFilters = useMemo(() => ({
    ...filters,
    dataInicio: '',
    dataFim: ''
  }), [filters]);

  const { filteredData: launchPlannerData } = useAdvancedFilters(data, launchPlannerFilters);

  const { filteredData: previousFilteredData } = useCalendarFilter(advancedFilteredData, previousFilters);

  const resultados = useResultadosMetrics(filteredData);

  const hasData = Object.keys(data).length > 0;

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'launch': return 'Launch Planner';
      case 'jornada': return 'Jornada & Disparos';
      case 'resultados': return 'Resultados';
      case 'orientador': return 'Orientador';
      case 'framework': return 'Framework';
      case 'diario': return 'Diário de Bordo';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A]">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0F172A] relative">

          {hasData && (
            <PageHeader title={getPageTitle(activeTab)}>
              {/* Toggle Filters Button inside Header */}
              <button
                onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                className={`p-2 rounded-lg transition ${showFiltersDrawer ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                title="Filtros Avançados"
              >
                <Menu size={20} />
              </button>
            </PageHeader>
          )}

          {/* Filters Sidebar - Fixed (Legacy support for now) */}
          {showFiltersDrawer && (
            <div className="absolute inset-y-0 right-0 z-40 w-80 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 top-16">
              <div className="h-full overflow-y-auto">
                <div className="p-4 flex justify-between items-center border-b border-slate-800">
                  <h3 className="font-bold text-slate-100">Filtros Avançados</h3>
                  <button onClick={() => setShowFiltersDrawer(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
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
            </div>
          )}

          <div className="flex-1 overflow-auto p-6">
            {!hasData && (
              <div className="flex flex-col items-center justify-center h-full">
                {!loading && (
                  <div className="max-w-md w-full bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Menu size={32} className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Bem-vindo ao Growth Brain</h2>
                    <p className="text-slate-400 mb-8">Faça upload do seu arquivo de dados para começar a análise.</p>
                    <CSVUpload
                      onFileSelect={processCSV}
                      onLoadSimulatedData={loadSimulatedData}
                      loading={loading}
                      error={error}
                      totalActivities={totalActivities}
                    />
                  </div>
                )}
                {loading && (
                  <div className="text-slate-400 animate-pulse">Carregando dados...</div>
                )}
              </div>
            )}

            {hasData && (
              <div className="h-full">
                {activeTab === 'launch' && (
                  <LaunchPlanner
                    data={launchPlannerData}
                    onActivityUpdate={(id, newDate) => updateActivity(id, { dataDisparo: newDate })}
                  />
                )}
                {activeTab === 'resultados' && (
                  <ResultadosView
                    resultados={resultados}
                    data={filteredData}
                    selectedBU={selectedBUs.length === 1 ? selectedBUs[0] : undefined}
                  />
                )}
                {activeTab === 'jornada' && (
                  <JornadaDisparosView
                    data={filteredData}
                    previousData={previousFilteredData}
                    selectedBU={selectedBUs.length === 1 ? selectedBUs[0] : undefined}
                    selectedCanais={filters.canais}
                    selectedSegmentos={filters.segmentos}
                    selectedParceiros={filters.parceiros}
                  />
                )}
                {activeTab === 'diario' && (
                  <DiarioBordo />
                )}
                {activeTab === 'framework' && (
                  <FrameworkView />
                )}
                {activeTab === 'orientador' && (
                  <OrientadorView />
                )}
                {!['launch', 'resultados', 'jornada', 'diario', 'framework', 'orientador'].includes(activeTab) && (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>Aba desconhecida: {activeTab}. Redirecionando...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
