import React from 'react';
import { Activity, AnomalyType } from '../../types/framework';
import { X } from 'lucide-react'; // AlertCircle, CheckCircle

interface DailyDetailsModalProps {
    date: Date | null;
    activities: Activity[];
    anomalyFilters?: AnomalyType[];
    onClose: () => void;
    titleOverride?: string;
}

export const DailyDetailsModal: React.FC<DailyDetailsModalProps> = ({ date, activities, anomalyFilters = [], onClose, titleOverride }) => {
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
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            {titleOverride ? titleOverride : `📅 Detalhes do Dia: ${date?.toLocaleDateString('pt-BR')}`}
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
                        // Anomaly Logic (re-calculated for display highlighting)
                        const rawCartoes = String(activity.raw['Cartões Gerados'] || '').toLowerCase().trim();
                        const isPending = rawCartoes.includes('aguardando') || rawCartoes.includes('confirmar');

                        const rawDisparado = String(activity.raw['Disparado?'] || '').toLowerCase().trim();
                        const isDisparado = ['sim', 's', 'yes', 'y', 'enviado', 'ok', 'true', '1'].includes(rawDisparado);

                        const hasDataIssues = isDisparado && (
                            (activity.kpis.baseEnviada || 0) === 0 ||
                            (activity.kpis.baseEntregue || 0) === 0 ||
                            (activity.kpis.taxaAbertura || 0) === 0
                        );

                        const isAnomaly = isPending || hasDataIssues;

                        return (
                            <div key={activity.id} className={`bg-slate-800/50 border rounded-lg p-3 transition ${isAnomaly ? 'border-amber-500/30 bg-amber-900/10' : 'border-slate-700/50'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isAnomaly ? 'bg-amber-900/50 text-amber-200' : 'bg-slate-700 text-slate-300'
                                                }`}>
                                                {activity.canal}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs font-medium text-slate-300">{activity.bu}</span>
                                            {activity.segmento && (
                                                <>
                                                    <span className="text-xs text-slate-400">•</span>
                                                    <span className="text-xs font-medium text-slate-300">{activity.segmento}</span>
                                                </>
                                            )}
                                            {activity.jornada && (
                                                <>
                                                    <span className="text-xs text-slate-400">•</span>
                                                    <span className="text-xs font-medium text-purple-300">{activity.jornada}</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-200 line-clamp-1" title={activity.id}>
                                            {activity.id}
                                        </h3>
                                    </div>

                                    {/* <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${isAnomaly ? 'text-amber-400 bg-amber-900/30' : 'text-emerald-400 bg-emerald-900/30'
                                        }`}>
                                        {isAnomaly ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                        {activity.raw['Disparado?']}
                                    </div> */}
                                </div>

                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5">Enviado</div>
                                        <div className="text-xs font-semibold text-slate-200">{activity.kpis.baseEnviada || 0}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5">Entregue</div>
                                        <div className={`text-xs font-semibold ${(activity.kpis.baseEntregue || 0) === 0 && isDisparado
                                            ? 'text-red-400'
                                            : 'text-slate-200'
                                            }`}>
                                            {activity.kpis.baseEntregue || 0}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5">Cartões</div>
                                        <div className="text-xs font-semibold text-blue-400">{activity.kpis.cartoes || 0}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <div className="text-[10px] text-slate-500 mb-0.5">Conversão</div>
                                        <div className="text-xs font-semibold text-emerald-400">
                                            {activity.kpis.taxaConversao ? (activity.kpis.taxaConversao * 100).toFixed(2) : 0}%
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
