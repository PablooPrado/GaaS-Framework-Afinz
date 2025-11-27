import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useRecommendationEngine } from '../hooks/useRecommendationEngine';
import { RecommendationCard } from './orientador/RecommendationCard';
import { HistoricoModal } from './orientador/HistoricoModal';
import { Recommendation } from '../types/recommendations';
import { Lightbulb, Filter, ArrowUpDown } from 'lucide-react';

type SortOption = 'score' | 'cac' | 'conversion' | 'volume' | 'recency';

export const OrientadorView: React.FC = () => {
    const { activities, viewSettings } = useAppStore();

    const recommendations = useRecommendationEngine(activities);
    const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('score');

    // Apply global filters and sorting
    const filteredRecommendations = useMemo(() => {
        const filters = viewSettings.filtrosGlobais;

        // 1. Filter
        const filtered = recommendations.filter(rec => {
            // BU Filter
            const matchesBU = filters.bu.length === 0 || rec.sampleActivities.some(a => filters.bu.includes(a.bu));

            const matchesCanal = filters.canais.length === 0 || filters.canais.includes(rec.combo.canal);
            const matchesSegmento = filters.segmentos.length === 0 || filters.segmentos.includes(rec.combo.segmento);
            const matchesParceiro = filters.parceiros.length === 0 || rec.sampleActivities.some(a => filters.parceiros.includes(a.parceiro));

            return matchesBU && matchesCanal && matchesSegmento && matchesParceiro;
        });

        // 2. Sort
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.score.finalScore - a.score.finalScore;
                case 'cac':
                    // Lower CAC is better, so ascending order. Handle 0/null as high value (bad)
                    const cacA = a.metrics.avgCAC > 0 ? a.metrics.avgCAC : 999999;
                    const cacB = b.metrics.avgCAC > 0 ? b.metrics.avgCAC : 999999;
                    return cacA - cacB;
                case 'conversion':
                    return b.metrics.avgConversion - a.metrics.avgConversion;
                case 'volume':
                    return b.metrics.totalVolume - a.metrics.totalVolume;
                case 'recency':
                    // More recent (larger timestamp) first
                    const dateA = a.metrics.lastExecuted?.getTime() || 0;
                    const dateB = b.metrics.lastExecuted?.getTime() || 0;
                    return dateB - dateA;
                default:
                    return 0;
            }
        });
    }, [recommendations, viewSettings.filtrosGlobais, sortBy]);

    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Lightbulb className="text-amber-400" />
                        Orientador Estratégico
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Recomendações baseadas no histórico de {activities.length} campanhas.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Sorting Controls */}
                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 px-2 flex items-center gap-1">
                            <ArrowUpDown size={12} /> Ordenar:
                        </span>
                        {[
                            { id: 'score', label: 'Score' },
                            { id: 'cac', label: 'Menor CAC' },
                            { id: 'conversion', label: 'Maior Conv.' },
                            { id: 'volume', label: 'Volume' },
                            { id: 'recency', label: 'Recente' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setSortBy(opt.id as SortOption)}
                                className={`px-3 py-1 text-xs font-medium rounded transition ${sortBy === opt.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                        <Filter size={12} />
                        Filtros Globais Ativos
                    </div>
                </div>
            </div>

            {filteredRecommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500">
                    <Lightbulb size={48} className="mb-4 opacity-20" />
                    <p>Nenhuma recomendação encontrada com os filtros atuais.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
                    {filteredRecommendations.map(rec => (
                        <RecommendationCard
                            key={rec.id}
                            recommendation={rec}
                            onClick={() => setSelectedRec(rec)}
                        />
                    ))}
                </div>
            )}

            {selectedRec && (
                <HistoricoModal
                    recommendation={selectedRec}
                    onClose={() => setSelectedRec(null)}
                />
            )}
        </div>
    );
};
