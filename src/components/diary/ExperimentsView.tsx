import React, { useState } from 'react';
import { useDiaryStore, DiaryEntry } from '../../store/diaryStore';
import { Plus, ArrowRight, MoreHorizontal, FlaskConical } from 'lucide-react';
import { SignificanceCalculator } from './SignificanceCalculator';

const COLUMNS = [
    { id: 'hipotese', label: 'Hipótese', color: 'border-amber-500/50' },
    { id: 'rodando', label: 'Rodando', color: 'border-blue-500/50' },
    { id: 'concluido', label: 'Concluído', color: 'border-emerald-500/50' },
    { id: 'aprendizado', label: 'Aprendizado', color: 'border-purple-500/50' },
] as const;

export const ExperimentsView: React.FC = () => {
    const { getExperimentos, updateEntry, addEntry } = useDiaryStore();
    const experiments = getExperimentos();
    const [selectedExp, setSelectedExp] = useState<DiaryEntry | null>(null);

    const handleStatusChange = (id: string, newStatus: DiaryEntry['statusExperimento']) => {
        updateEntry(id, { statusExperimento: newStatus });
    };

    const handleCreateExperiment = () => {
        // Create a blank experiment
        addEntry({
            date: new Date().toISOString().split('T')[0],
            bu: 'B2C', // Default, user can change
            title: 'Novo Experimento',
            description: '',
            segmentos: [],
            parceiros: [],
            isTesteAB: true,
            statusExperimento: 'hipotese',
            hipotese: '',
            conclusao: ''
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <FlaskConical className="text-purple-400" />
                        Gestor de Experimentos
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Gerencie seus testes A/B e valide hipóteses.
                    </p>
                </div>
                <button
                    onClick={handleCreateExperiment}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                >
                    <Plus size={18} />
                    Novo Experimento
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden min-h-0">
                {COLUMNS.map(col => (
                    <div key={col.id} className="flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 h-full overflow-hidden">
                        <div className={`p-3 border-b border-slate-800 flex items-center justify-between border-t-2 ${col.color}`}>
                            <span className="font-bold text-slate-300 text-sm uppercase">{col.label}</span>
                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                {experiments.filter(e => e.statusExperimento === col.id).length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {experiments
                                .filter(e => e.statusExperimento === col.id)
                                .map(exp => (
                                    <div
                                        key={exp.id}
                                        onClick={() => setSelectedExp(exp)}
                                        className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 cursor-pointer transition group relative"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${exp.bu === 'B2C' ? 'bg-blue-900/30 border-blue-800 text-blue-300' :
                                                exp.bu === 'B2B2C' ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300' :
                                                    'bg-purple-900/30 border-purple-800 text-purple-300'
                                                }`}>
                                                {exp.bu}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{exp.date}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-200 mb-1 line-clamp-2">{exp.title}</h4>
                                        {exp.hipotese && (
                                            <p className="text-xs text-slate-400 line-clamp-2 mb-2 italic">"{exp.hipotese}"</p>
                                        )}

                                        {/* Quick Actions (Hover) */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            {col.id !== 'aprendizado' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const next = col.id === 'hipotese' ? 'rodando' : col.id === 'rodando' ? 'concluido' : 'aprendizado';
                                                        handleStatusChange(exp.id, next as any);
                                                    }}
                                                    className="p-1 bg-slate-700 hover:bg-blue-600 rounded text-slate-300 hover:text-white"
                                                    title="Avançar"
                                                >
                                                    <ArrowRight size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Experiment Details Modal (Simplified as an overlay for now) */}
            {selectedExp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                            <div>
                                <input
                                    type="text"
                                    value={selectedExp.title}
                                    onChange={(e) => updateEntry(selectedExp.id, { title: e.target.value })}
                                    className="bg-transparent text-xl font-bold text-white border-none focus:ring-0 p-0 w-full"
                                    placeholder="Nome do Experimento"
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <select
                                        value={selectedExp.bu}
                                        onChange={(e) => updateEntry(selectedExp.id, { bu: e.target.value as any })}
                                        className="bg-slate-800 border-slate-700 rounded text-xs text-slate-300"
                                    >
                                        <option value="B2C">B2C</option>
                                        <option value="B2B2C">B2B2C</option>
                                        <option value="Plurix">Plurix</option>
                                    </select>
                                    <select
                                        value={selectedExp.statusExperimento}
                                        onChange={(e) => updateEntry(selectedExp.id, { statusExperimento: e.target.value as any })}
                                        className="bg-slate-800 border-slate-700 rounded text-xs text-slate-300"
                                    >
                                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => setSelectedExp(null)} className="text-slate-400 hover:text-white">
                                <MoreHorizontal size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Hipótese */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Hipótese</label>
                                <textarea
                                    value={selectedExp.hipotese || ''}
                                    onChange={(e) => updateEntry(selectedExp.id, { hipotese: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm min-h-[80px]"
                                    placeholder="Se fizermos X, esperamos Y..."
                                />
                            </div>

                            {/* Calculator Section */}
                            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-200">Dados & Resultados</h3>
                                </div>
                                <SignificanceCalculator
                                    initialMetrics={selectedExp.metrics}
                                    onCalculate={(metrics) => updateEntry(selectedExp.id, { metrics })}
                                />
                            </div>

                            {/* Conclusão */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Conclusão / Aprendizado</label>
                                <textarea
                                    value={selectedExp.conclusao || ''}
                                    onChange={(e) => updateEntry(selectedExp.id, { conclusao: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm min-h-[80px]"
                                    placeholder="O que aprendemos com este teste?"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setSelectedExp(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                            >
                                Salvar e Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
