import React, { useState } from 'react';
import { Target, Save, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GoalsManager: React.FC = () => {
    const { goals, setGoals } = useAppStore();
    const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
    const [loading, setLoading] = useState(false);

    // Generate list of 6 months around current date
    const months = Array.from({ length: 1 }, (_, i) => {
        // Just showing 1 month card for the selected date for simplicity, 
        // or maybe a grid. Let's do a single month card with navigation.
        return currentDate;
    });

    const currentMonthKey = format(currentDate, 'yyyy-MM');
    const currentGoal = goals.find(g => g.mes === currentMonthKey) || {
        mes: currentMonthKey,
        cartoes_meta: 0,
        b2c_meta: 0,
        cac_max: 0
    };

    const [formState, setFormState] = useState({
        cartoes_meta: currentGoal.cartoes_meta || 0,
        b2c_meta: currentGoal.b2c_meta || 0,
        cac_max: currentGoal.cac_max || 0
    });

    // Update form when month changes
    React.useEffect(() => {
        const goal = goals.find(g => g.mes === currentMonthKey);
        setFormState({
            cartoes_meta: goal?.cartoes_meta || 0,
            b2c_meta: goal?.b2c_meta || 0,
            cac_max: goal?.cac_max || 0
        });
    }, [currentMonthKey, goals]);

    const handleSave = () => {
        setLoading(true);
        // Simulate API delay
        setTimeout(() => {
            const newGoals = [...goals.filter(g => g.mes !== currentMonthKey)];
            newGoals.push({
                mes: currentMonthKey,
                cartoes_meta: Number(formState.cartoes_meta),
                b2c_meta: Number(formState.b2c_meta),
                cac_max: Number(formState.cac_max)
            });
            setGoals(newGoals);
            setLoading(false);
        }, 500);
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
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h4 className="text-lg font-bold text-white capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h4>
                    </div>
                    <button
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
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
                            <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded">Launch Planner</span>
                        </label>
                        <div className="relative group">
                            <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="number"
                                value={formState.cartoes_meta}
                                onChange={e => setFormState({ ...formState, cartoes_meta: Number(e.target.value) })}
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
                                onChange={e => setFormState({ ...formState, b2c_meta: Number(e.target.value) })}
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
                                onChange={e => setFormState({ ...formState, cac_max: Number(e.target.value) })}
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
        </div>
    );
};
