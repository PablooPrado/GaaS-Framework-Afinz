import React from 'react';
import { Activity, AnomalyType } from '../../types/framework';
import { X, Edit2, Info, Check } from 'lucide-react'; // AlertCircle, CheckCircle

interface DailyDetailsModalProps {
    date: Date | null;
    activities: Activity[];
    anomalyFilters?: AnomalyType[];
    onClose: () => void;
    onEdit?: (activity: Activity) => void;
    onConfirmDraft?: (activity: Activity) => void;
    titleOverride?: string;
}

export const DailyDetailsModal: React.FC<DailyDetailsModalProps> = ({
    date,
    activities,
    anomalyFilters = [],
    onClose,
    onEdit,
    onConfirmDraft,
    titleOverride
}) => {
    if (!date && !titleOverride) return null;

    // Filter activities based on anomaly filters if any
    const filteredActivities = activities.filter(activity => {
        // If no filters, show all
        if (anomalyFilters.length === 0) return true;

        const rawCartoes = String(activity.raw['Cartões Gerados'] || '').toLowerCase().trim();
        const isPending = rawCartoes.includes('aguardando') || rawCartoes.includes('confirmar');

        const rawDisparado = String(activity.raw['Disparado?'] || '').toLowerCase().trim();
        const isDisparado = ['sim', 's', 'yes', 'y', 'enviado', 'ok', 'true', '1'].includes(rawDisparado);

        const isNoSent = isDisparado && (activity.kpis.baseEnviada || 0) === 0;
        const isNoDelivered = isDisparado && (activity.kpis.baseEntregue || 0) === 0;
        const isNoOpen = isDisparado && (activity.kpis.taxaAbertura || 0) === 0;

        if (anomalyFilters.includes('pending') && isPending) return true;
        if (anomalyFilters.includes('no_sent') && isNoSent) return true;
        if (anomalyFilters.includes('no_delivered') && isNoDelivered) return true;
        if (anomalyFilters.includes('no_open') && isNoOpen) return true;

        return false;
    });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            {titleOverride ? titleOverride : `Detalhes do Dia: ${date?.toLocaleDateString('pt-BR')}`}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {filteredActivities.length} atividades registradas {anomalyFilters.length > 0 && '(Filtrado)'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredActivities.map((activity) => {
                        const rawCartoes = String(activity.raw['Cartões Gerados'] || '').toLowerCase().trim();
                        const isPending = rawCartoes.includes('aguardando') || rawCartoes.includes('confirmar');

                        // Detect draft status
                        const activityStatus = activity.raw['status'] || activity.raw['Status'] || 'Realizado';
                        const isDraft = activityStatus === 'Rascunho';

                        // BU Colors
                        const buColors = {
                            'B2C': 'border-blue-500/50 bg-blue-500/5',
                            'B2B2C': 'border-purple-500/50 bg-purple-500/5',
                            'Plurix': 'border-green-500/50 bg-green-500/5'
                        };
                        const cardBorderColor = isDraft ? 'border-slate-700/50' : (buColors[activity.bu as keyof typeof buColors] || 'border-slate-700/50');

                        return (
                            <div key={activity.id} className={`bg-slate-800/50 border rounded-lg p-3 transition ${cardBorderColor}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-slate-100 mb-1">{activity.id}</h3>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{activity.bu}</span>
                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">{activity.canal}</span>
                                            {isPending && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Pendente</span>}
                                            {isDraft && <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 rounded">Rascunho</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Confirm Button (only for drafts) */}
                                        {isDraft && onConfirmDraft && (
                                            <button
                                                onClick={() => onConfirmDraft(activity)}
                                                className="p-1.5 hover:bg-green-900/30 rounded transition text-green-500 hover:text-green-400 border border-green-500/30"
                                                title="Confirmar disparo"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                        {/* Edit Button (ALL dispatches) */}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(activity)}
                                                className="p-1.5 hover:bg-slate-700 rounded transition text-slate-400 hover:text-blue-400"
                                                title="Editar disparo"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                            Enviado <Info size={10} className="opacity-30" />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-200">{activity.kpis.baseEnviada || 0}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                            Entregue <Info size={10} className="opacity-30" />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-200">
                                            {activity.kpis.baseEntregue || 0}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                            Cartões <Info size={10} className="opacity-30" />
                                        </div>
                                        <div className="text-xs font-semibold text-blue-400">{activity.kpis.cartoes || 0}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                            Conversão <Info size={10} className="opacity-30" />
                                        </div>
                                        <div className="text-xs font-semibold text-emerald-400">
                                            {activity.kpis.taxaConversao ? (activity.kpis.taxaConversao * 100).toFixed(2) : 0}%
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                            Custo <Info size={10} className="opacity-30" />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-200">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.kpis.custoTotal || 0)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                            CAC <Info size={10} className="opacity-30" />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-200">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.kpis.cac || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
