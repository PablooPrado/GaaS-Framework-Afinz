import React, { useState } from 'react';
import { Target, Save, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const GoalsManager: React.FC = () => {
    const { goals, setGoals } = useAppStore();
    // Native start of month
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [loading, setLoading] = useState(false);

    // Native helpers
    const getMonthKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const addMonth = (date: Date, amount: number) => {
        return new Date(date.getFullYear(), date.getMonth() + amount, 1);
    };

    const currentMonthKey = getMonthKey(currentDate);

    // Initialize form state
    // We use string | number to allow empty strings during typing
    const [formState, setFormState] = useState<{
        cartoes_meta: string | number;
        b2c_meta: string | number;
        plurix_meta: string | number;
        b2b2c_meta: string | number;
        cac_max: string | number;
    }>({
        cartoes_meta: 0,
        b2c_meta: 0,
        plurix_meta: 0,
        b2b2c_meta: 0,
        cac_max: 0
    });

    // Update form when month or goals change
    React.useEffect(() => {
        const goal = goals.find(g => g.mes === currentMonthKey);
        setFormState({
            cartoes_meta: goal?.cartoes_meta || 0,
            b2c_meta: goal?.b2c_meta || 0,
            plurix_meta: goal?.plurix_meta || 0,
            b2b2c_meta: goal?.b2b2c_meta || 0,
            cac_max: goal?.cac_max || 0
        });
    }, [currentMonthKey, goals]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const newGoalEntry = {
                mes: currentMonthKey,
                cartoes_meta: Number(formState.cartoes_meta) || 0,
                b2c_meta: Number(formState.b2c_meta) || 0,
                plurix_meta: Number(formState.plurix_meta) || 0,
                b2b2c_meta: Number(formState.b2b2c_meta) || 0,
                cac_max: Number(formState.cac_max) || 0
            };

            // 1. Update Local Store
            const newGoals = [...goals.filter(g => g.mes !== currentMonthKey)];
            newGoals.push(newGoalEntry);
            setGoals(newGoals);

            // 2. Sync to Cloud
            const { dataService } = await import('../../services/dataService');
            await dataService.upsertGoal(newGoalEntry);

            alert('Meta salva com sucesso!');

        } catch (error: any) {
            console.error('Erro ao salvar meta:', error);
            alert(`Erro ao salvar meta na nuvem: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 shadow-inner">
                    <Target size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Gerenciador de Metas</h3>
                    <p className="text-sm text-slate-400">Defina os objetivos mensais para os KPIs.</p>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 relative z-10">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setCurrentDate(addMonth(currentDate, -1))}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h4 className="text-lg font-bold text-white capitalize">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h4>
                    </div>
                    <button
                        onClick={() => setCurrentDate(addMonth(currentDate, 1))}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Meta CRM */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            Meta CRM (Cartões)
                            <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded">CRM</span>
                        </label>
                        <div className="relative group">
                            <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="number"
                                value={formState.cartoes_meta}
                                onChange={e => setFormState({ ...formState, cartoes_meta: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-blue-500 transition-all placeholder-slate-600"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Meta B2C Total */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            Meta B2C Total
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded">Geral</span>
                        </label>
                        <div className="relative group">
                            <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="number"
                                value={formState.b2c_meta}
                                onChange={e => setFormState({ ...formState, b2c_meta: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-600"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* CAC Max */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">CAC Máximo (R$)</label>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors text-xs font-bold">R$</span>
                            <input
                                type="number"
                                value={formState.cac_max}
                                onChange={e => setFormState({ ...formState, cac_max: e.target.value })}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-amber-500 transition-all placeholder-slate-600"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                {/* Meta Plurix */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        Meta Plurix
                        <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded">BU</span>
                    </label>
                    <div className="relative group">
                        <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="number"
                            value={formState.plurix_meta}
                            onChange={e => setFormState({ ...formState, plurix_meta: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-purple-500 transition-all placeholder-slate-600"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Meta B2B2C */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        Meta B2B2C
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded">BU</span>
                    </label>
                    <div className="relative group">
                        <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="number"
                            value={formState.b2b2c_meta}
                            onChange={e => setFormState({ ...formState, b2b2c_meta: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-600"
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* CAC Max */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">CAC Máximo (R$)</label>
                    <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors text-xs font-bold">R$</span>
                        <input
                            type="number"
                            value={formState.cac_max}
                            onChange={e => setFormState({ ...formState, cac_max: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-amber-500 transition-all placeholder-slate-600"
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={16} />
                    {loading ? 'Salvando...' : 'Salvar Metas'}
                </button>
            </div>
        </div>
    );
};
