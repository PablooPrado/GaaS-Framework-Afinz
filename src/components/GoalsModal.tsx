import React, { useState, useEffect } from 'react';
import { X, Save, Target } from 'lucide-react';
import { Goal } from '../types/framework';

interface GoalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Goal) => void;
    initialGoal: Goal;
    currentMonthLabel: string;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialGoal,
    currentMonthLabel
}) => {
    const [activeTab, setActiveTab] = useState<'Global' | 'B2C' | 'B2B2C' | 'Plurix'>('Global');

    // Global State
    const [cartoes, setCartoes] = useState(initialGoal.cartoes_meta?.toString() || '');
    const [aprovacoes, setAprovacoes] = useState(initialGoal.aprovacoes_meta?.toString() || '');
    const [cacMax, setCacMax] = useState(initialGoal.cac_max?.toString() || '');

    // BU States
    const [buGoals, setBuGoals] = useState<{ [key: string]: { cartoes: string; aprovacoes: string; cac: string } }>({
        B2C: { cartoes: '', aprovacoes: '', cac: '' },
        B2B2C: { cartoes: '', aprovacoes: '', cac: '' },
        Plurix: { cartoes: '', aprovacoes: '', cac: '' }
    });

    useEffect(() => {
        if (isOpen) {
            setCartoes(initialGoal.cartoes_meta?.toString() || '');
            setAprovacoes(initialGoal.aprovacoes_meta?.toString() || '');
            setCacMax(initialGoal.cac_max?.toString() || '');

            const newBuGoals = {
                B2C: { cartoes: '', aprovacoes: '', cac: '' },
                B2B2C: { cartoes: '', aprovacoes: '', cac: '' },
                Plurix: { cartoes: '', aprovacoes: '', cac: '' }
            };

            if (initialGoal.bus) {
                Object.entries(initialGoal.bus).forEach(([bu, data]) => {
                    if (newBuGoals[bu as keyof typeof newBuGoals]) {
                        newBuGoals[bu as keyof typeof newBuGoals] = {
                            cartoes: data.cartoes?.toString() || '',
                            aprovacoes: data.aprovacoes?.toString() || '',
                            cac: data.cac?.toString() || ''
                        };
                    }
                });
            }
            setBuGoals(newBuGoals);
        }
    }, [isOpen, initialGoal]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const busData: any = {};
        Object.entries(buGoals).forEach(([bu, data]) => {
            busData[bu] = {
                cartoes: Number(data.cartoes) || 0,
                aprovacoes: Number(data.aprovacoes) || 0,
                cac: Number(data.cac) || 0
            };
        });

        onSave({
            mes: initialGoal.mes,
            cartoes_meta: Number(cartoes) || 0,
            aprovacoes_meta: Number(aprovacoes) || 0,
            cac_max: Number(cacMax) || 0,
            bus: busData
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Target className="text-blue-400" size={20} />
                        Definir Metas: {currentMonthLabel}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-slate-700">
                    {['Global', 'B2C', 'B2B2C', 'Plurix'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === tab
                                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
                                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {activeTab === 'Global' ? (
                        <>
                            <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 mb-4">
                                <p className="text-xs text-blue-300">
                                    Defina as metas consolidadas da empresa. As metas por BU podem ser definidas nas outras abas.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Meta de Cartões Gerados (Global)
                                </label>
                                <input
                                    type="number"
                                    value={cartoes}
                                    onChange={(e) => setCartoes(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: 5000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Meta de Aprovações (Global)
                                </label>
                                <input
                                    type="number"
                                    value={aprovacoes}
                                    onChange={(e) => setAprovacoes(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: 12000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    CAC Máximo Aceitável (Global)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cacMax}
                                    onChange={(e) => setCacMax(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: 45.00"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700 mb-4">
                                <p className="text-xs text-slate-400">
                                    Definindo metas específicas para <span className="font-bold text-white">{activeTab}</span>.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Meta de Cartões ({activeTab})
                                </label>
                                <input
                                    type="number"
                                    value={buGoals[activeTab].cartoes}
                                    onChange={(e) => setBuGoals({
                                        ...buGoals,
                                        [activeTab]: { ...buGoals[activeTab], cartoes: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: 1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Meta de Aprovações ({activeTab})
                                </label>
                                <input
                                    type="number"
                                    value={buGoals[activeTab].aprovacoes}
                                    onChange={(e) => setBuGoals({
                                        ...buGoals,
                                        [activeTab]: { ...buGoals[activeTab], aprovacoes: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: 3000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    CAC Máximo ({activeTab})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={buGoals[activeTab].cac}
                                    onChange={(e) => setBuGoals({
                                        ...buGoals,
                                        [activeTab]: { ...buGoals[activeTab], cac: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: 50.00"
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20"
                        >
                            <Save size={18} />
                            Salvar Metas
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
