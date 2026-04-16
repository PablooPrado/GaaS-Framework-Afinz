/**
 * BudgetTabV2
 *
 * Main budget management interface
 * Two-level hierarchy: Objective > Campaign
 * Features: Visualization, CRUD, Intelligent reallocation
 */

import React, { useState, useMemo } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { dataService } from '../../../../services/dataService';
import { useBudgetHierarchy } from '../../hooks/useBudgetHierarchy';
import { useFilters } from '../../context/FilterContext';
import { ObjectiveBudgetCard } from '../ObjectiveBudgetCard';
import { CampaignBudgetTable } from '../CampaignBudgetTable';
import { EditCampaignBudgetModal } from '../Modals/EditCampaignBudgetModal';
import { EditObjectiveBudgetModal } from '../Modals/EditObjectiveBudgetModal';
import { RealocateBudgetOrchestrator } from '../Modals/RealocateBudgetOrchestrator';
import { CampaignBudget, ObjectiveBudget, BudgetObjective } from '../../types/budget';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export const BudgetTabV2: React.FC = () => {
  const { filters } = useFilters();
  const currentMonth = format(filters.dateRange.to || new Date(), 'MM/yyyy');

  // Data fetching
  const { objectives, campaigns, status, loading, error, refetch } = useBudgetHierarchy(currentMonth);

  // Objective modal state
  const [editingObjective, setEditingObjective] = useState<ObjectiveBudget | undefined>();
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);

  // Campaign modal state
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignBudget | undefined>();
  const [newCampaignObjectiveId, setNewCampaignObjectiveId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReallocateOpen, setIsReallocateOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get campaigns for expanded objective
  const campaignsForObjective = useMemo(() => {
    if (!expandedObjective) return [];
    return campaigns.filter((c) => c.objectiveBudgetId === expandedObjective);
  }, [campaigns, expandedObjective]);

  // ── Objective CRUD ──────────────────────────────────────────────────────

  const handleSaveObjective = async (data: {
    id?: string;
    month: string;
    objective: BudgetObjective;
    budget: number;
    channel?: string | null;
  }) => {
    setIsLoading(true);
    try {
      const dbPayload = {
        id: data.id || crypto.randomUUID(),
        month: data.month,
        objective: data.objective,
        budget: data.budget,
        channel: data.channel || null,
      };
      await dataService.upsertPaidMediaBudget(dbPayload);
      await refetch();
      setIsObjectiveModalOpen(false);
      setEditingObjective(undefined);
    } catch (err) {
      console.error('Error saving objective:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Campaign CRUD ───────────────────────────────────────────────────────

  const handleSaveCampaign = async (campaign: Omit<CampaignBudget, 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      // Map camelCase TypeScript types → snake_case DB columns
      const dbPayload = {
        id: campaign.id || crypto.randomUUID(),
        month: campaign.month || currentMonth,
        objective_budget_id: campaign.objectiveBudgetId,
        campaign_name: campaign.campaignName,
        objective: campaign.objective,
        channel: campaign.channel,
        allocated_budget: campaign.allocatedBudget,
        notes: campaign.notes || null,
      };
      await dataService.upsertCampaignBudget(dbPayload);
      await refetch();
      setIsEditModalOpen(false);
      setEditingCampaign(undefined);
      setNewCampaignObjectiveId(null);
    } catch (err) {
      console.error('Error saving campaign:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta campanha?')) return;

    setIsLoading(true);
    try {
      await dataService.deleteCampaignBudget(id);
      await refetch();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Erro ao deletar campanha');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reallocation ────────────────────────────────────────────────────────

  const handleConfirmReallocation = async (reallocations: Array<{ id: string; allocatedBudget: number }>) => {
    setIsLoading(true);
    try {
      // Map camelCase → snake_case for the DB call
      const dbPayload = reallocations.map((r) => ({
        id: r.id,
        allocated_budget: r.allocatedBudget,
      }));
      await dataService.updateCampaignBudgetAllocations(dbPayload);
      await refetch();
      setIsReallocateOpen(null);
    } catch (err) {
      console.error('Error reallocating budget:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Helper: get the objective to pass to the campaign modal ────────────

  const getCampaignModalObjective = (): ObjectiveBudget => {
    if (editingCampaign) {
      return (objectives.find((o) => o.id === editingCampaign.objectiveBudgetId) as ObjectiveBudget)
        ?? objectives[0] as ObjectiveBudget;
    }
    if (newCampaignObjectiveId) {
      return (objectives.find((o) => o.id === newCampaignObjectiveId) as ObjectiveBudget)
        ?? objectives[0] as ObjectiveBudget;
    }
    return objectives[0] as ObjectiveBudget;
  };

  // ── States ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 font-medium">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-medium">Erro ao carregar orçamentos</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Orçamento — {currentMonth}</h2>
        <p className="text-slate-500 mt-1">
          Acompanhe seus gastos diários vs planejado com projeções em tempo real
        </p>
      </div>

      {/* ── Overall KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Planejado Total',
            value: objectives.reduce((s, o) => s + o.totalBudget, 0),
            color: 'text-slate-800',
          },
          {
            label: 'Realizado Total',
            value: status.cumulativeActual,
            color: 'text-blue-600',
          },
          {
            label: 'Projeção',
            value: status.projectionFull,
            color:
              status.status === 'overspending'
                ? 'text-red-600'
                : status.status === 'underspending'
                  ? 'text-amber-600'
                  : 'text-slate-800',
          },
          {
            label: 'Ritmo Geral',
            value: `${status.paceIndex.toFixed(2)}x`,
            color: 'text-slate-800',
          },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>
              {typeof kpi.value === 'number'
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(kpi.value)
                : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Objectives List ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Orçamento por Objetivo</h3>
          <button
            onClick={() => {
              setEditingObjective(undefined);
              setIsObjectiveModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Novo Objetivo
          </button>
        </div>

        {objectives.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium mb-1">Nenhum orçamento configurado para {currentMonth}</p>
            <p className="text-slate-400 text-sm mb-5">
              Crie orçamentos por objetivo para acompanhar seus gastos e projeções
            </p>
            <button
              onClick={() => {
                setEditingObjective(undefined);
                setIsObjectiveModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              <Plus size={15} />
              Criar Primeiro Orçamento
            </button>
          </div>
        ) : (
          objectives.map((objective) => (
            <div key={objective.id}>
              <ObjectiveBudgetCard
                objective={objective}
                campaignsCount={campaigns.filter((c) => c.objectiveBudgetId === objective.id).length}
                isExpanded={expandedObjective === objective.id}
                onToggleExpand={() =>
                  setExpandedObjective(expandedObjective === objective.id ? null : objective.id)
                }
                onEdit={() => {
                  setEditingObjective(objective);
                  setIsObjectiveModalOpen(true);
                }}
                onAddCampaign={() => {
                  setEditingCampaign(undefined);
                  setNewCampaignObjectiveId(objective.id);
                  // Auto-expand
                  setExpandedObjective(objective.id);
                  setIsEditModalOpen(true);
                }}
              />

              {/* Expanded Campaign Table */}
              {expandedObjective === objective.id && (
                <div className="mt-3 animate-fade-in">
                  <CampaignBudgetTable
                    campaigns={campaignsForObjective}
                    onEdit={(campaign) => {
                      setEditingCampaign(campaign);
                      setNewCampaignObjectiveId(null);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteCampaign}
                    onRelocate={() => setIsReallocateOpen(objective.id)}
                    onAdd={() => {
                      setEditingCampaign(undefined);
                      setNewCampaignObjectiveId(objective.id);
                      setIsEditModalOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* Objective Modal */}
      <EditObjectiveBudgetModal
        isOpen={isObjectiveModalOpen}
        objective={editingObjective}
        month={currentMonth}
        onSave={handleSaveObjective}
        onClose={() => {
          setIsObjectiveModalOpen(false);
          setEditingObjective(undefined);
        }}
        isLoading={isLoading}
      />

      {/* Campaign Modal */}
      {objectives.length > 0 && (
        <EditCampaignBudgetModal
          isOpen={isEditModalOpen}
          campaign={editingCampaign}
          objective={getCampaignModalObjective()}
          currentMonth={currentMonth}
          onSave={handleSaveCampaign}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCampaign(undefined);
            setNewCampaignObjectiveId(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Reallocation Modal */}
      {isReallocateOpen && (
        <RealocateBudgetOrchestrator
          isOpen={true}
          campaigns={campaignsForObjective}
          onConfirm={handleConfirmReallocation}
          onClose={() => setIsReallocateOpen(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
