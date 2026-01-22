import { useState, useMemo } from 'react';
import { StrategyMetrics } from '../types/strategy';
import { DistributionAnalysis } from './DistributionAnalysis';
import { GoalsVisualization } from './GoalsVisualization';
import { GoalsModal } from './GoalsModal';
import { ProjectionsSection } from './resultados/ProjectionsSection';
import { useGoals } from '../hooks/useGoals';
import { CalendarData } from '../types/framework';
import { Target } from 'lucide-react';

interface ResultadosViewProps {
  resultados: StrategyMetrics;
  data: CalendarData;
  selectedBU?: string;
}

export const ResultadosView: React.FC<ResultadosViewProps> = ({ resultados, data, selectedBU }) => {
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const { getGoal, saveGoal } = useGoals();

  // Determinar mês atual baseado nos dados (pega o mês mais recente com dados)
  const currentMonthKey = Object.keys(data).sort().pop()?.substring(0, 7) || new Date().toISOString().substring(0, 7);
  const fullGoal = getGoal(currentMonthKey);

  // Determine active goal based on selection
  const currentGoal = useMemo(() => {
    if (selectedBU && fullGoal.bus && fullGoal.bus[selectedBU]) {
      return {
        mes: fullGoal.mes,
        cartoes_meta: fullGoal.bus[selectedBU].cartoes,
        aprovacoes_meta: fullGoal.bus[selectedBU].aprovacoes,
        cac_max: fullGoal.bus[selectedBU].cac
      };
    }
    return fullGoal;
  }, [fullGoal, selectedBU]);

  const sortedResultados = Object.values(resultados).sort((a, b) => b.totalCartoes - a.totalCartoes);

  // Calcular totais para o GoalsVisualization
  const totalCartoes = sortedResultados.reduce((acc, curr) => acc + curr.totalCartoes, 0);
  let totalAprovacoes = 0;
  let totalCusto = 0;
  Object.values(data).flat().forEach(activity => {
    totalAprovacoes += activity.kpis.aprovados || 0;
    totalCusto += activity.kpis.custoTotal || 0;
  });

  const currentCAC = totalCartoes > 0 ? totalCusto / totalCartoes : 0;

  if (Object.keys(resultados).length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Nenhum resultado registrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Análise de Distribuição */}
      <DistributionAnalysis data={data} />

      {/* 2. Projections Section (Evolução + Projeção do Mês) */}
      <ProjectionsSection
        data={data}
        currentGoal={currentGoal}
        selectedBU={selectedBU}
      />

      {/* 3. Meta vs Realizado | Comparativo de Canais */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Target size={20} className="text-blue-400" />
              Meta vs. Realizado <span className="text-slate-500 text-sm font-normal">({selectedBU || 'Global'})</span>
            </h2>
            <button
              onClick={() => setIsGoalsModalOpen(true)}
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              Definir Metas
            </button>
          </div>

          <GoalsVisualization
            goal={currentGoal}
            currentCartoes={totalCartoes}
            currentAprovacoes={totalAprovacoes}
            currentCAC={currentCAC}
            scope={selectedBU || 'Global'}
          />
        </div>
      </div>

      {/* Modal de Metas */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onSave={saveGoal}
        initialGoal={fullGoal}
        currentMonthLabel={currentMonthKey}
      />
    </div>
  );
};
