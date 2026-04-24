import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { OBJECTIVE_COLORS, getObjectiveColorClasses } from '../types';
import type { PaidMediaObjectiveEntry } from '../types';

// ── Color picker ──────────────────────────────────────────────────────────────

const ColorPicker: React.FC<{ value: string; onChange: (key: string) => void }> = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
        {OBJECTIVE_COLORS.map(c => (
            <button
                key={c.key}
                type="button"
                onClick={() => onChange(c.key)}
                title={c.label}
                className={`w-5 h-5 rounded-full transition-all ${c.dot} ${value === c.key ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
            />
        ))}
    </div>
);

// ── Inline edit row ───────────────────────────────────────────────────────────

const EditRow: React.FC<{
    initial: PaidMediaObjectiveEntry;
    onSave: (updates: Omit<PaidMediaObjectiveEntry, 'key'>) => void;
    onCancel: () => void;
}> = ({ initial, onSave, onCancel }) => {
    const [label, setLabel] = useState(initial.label);
    const [color, setColor] = useState(initial.color);

    return (
        <tr className="bg-blue-50/30">
            <td className="px-4 py-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{initial.key}</span>
            </td>
            <td className="px-4 py-2">
                <input
                    autoFocus
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/30 focus:border-[#00C6CC]"
                />
            </td>
            <td className="px-4 py-2">
                <ColorPicker value={color} onChange={setColor} />
            </td>
            <td className="px-4 py-2">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => { if (label.trim()) onSave({ label: label.trim(), color }); }}
                        className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        title="Salvar"
                    >
                        <Check size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        title="Cancelar"
                    >
                        <X size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// ── Add row ───────────────────────────────────────────────────────────────────

const AddRow: React.FC<{ onAdd: (entry: PaidMediaObjectiveEntry) => void; existingKeys: string[] }> = ({ onAdd, existingKeys }) => {
    const [key, setKey] = useState('');
    const [label, setLabel] = useState('');
    const [color, setColor] = useState('slate');
    const [keyError, setKeyError] = useState('');

    const handleAdd = () => {
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!cleanKey) { setKeyError('Chave obrigatória'); return; }
        if (existingKeys.includes(cleanKey)) { setKeyError('Chave já existe'); return; }
        if (!label.trim()) return;
        onAdd({ key: cleanKey, label: label.trim(), color });
        setKey(''); setLabel(''); setColor('slate'); setKeyError('');
    };

    return (
        <tr className="bg-slate-50/60 border-t-2 border-dashed border-slate-200">
            <td className="px-4 py-3">
                <div>
                    <input
                        value={key}
                        onChange={e => { setKey(e.target.value); setKeyError(''); }}
                        placeholder="ex: retencao"
                        className={`w-full text-xs font-mono border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/30 focus:border-[#00C6CC] ${keyError ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                    />
                    {keyError && <p className="text-[10px] text-red-500 mt-0.5">{keyError}</p>}
                </div>
            </td>
            <td className="px-4 py-3">
                <input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Nome de exibição"
                    className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/30 focus:border-[#00C6CC]"
                />
            </td>
            <td className="px-4 py-3">
                <ColorPicker value={color} onChange={setColor} />
            </td>
            <td className="px-4 py-3">
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!key.trim() || !label.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C6CC] text-white rounded-md text-xs font-semibold hover:bg-[#00B0B5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus size={13} />
                    Adicionar
                </button>
            </td>
        </tr>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

export const ObjectivesManager: React.FC = () => {
    const { objectives, addObjective, updateObjective, removeObjective } = useFilters();
    const [editingKey, setEditingKey] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-sm font-semibold text-slate-700">Objetivos de Mídia Paga</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Cadastre os objetivos usados no mapeamento de campanhas. A chave (<code>key</code>) é o valor salvo no banco — não pode ser alterada após criação.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-2.5 w-36">Chave (BD)</th>
                            <th className="px-4 py-2.5">Nome de Exibição</th>
                            <th className="px-4 py-2.5 w-52">Cor</th>
                            <th className="px-4 py-2.5 w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {objectives.map(obj => {
                            const colors = getObjectiveColorClasses(obj.color);
                            if (editingKey === obj.key) {
                                return (
                                    <EditRow
                                        key={obj.key}
                                        initial={obj}
                                        onSave={(updates) => {
                                            updateObjective(obj.key, updates);
                                            setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                    />
                                );
                            }
                            return (
                                <tr key={obj.key} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{obj.key}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                                            <span className="text-sm font-medium text-slate-700">{obj.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colors.chipActive}`}>
                                            <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                            {OBJECTIVE_COLORS.find(c => c.key === obj.color)?.label ?? obj.color}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setEditingKey(obj.key)}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm(`Remover objetivo "${obj.label}"? Campanhas já mapeadas não serão afetadas.`))
                                                        removeObjective(obj.key);
                                                }}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        <AddRow
                            onAdd={addObjective}
                            existingKeys={objectives.map(o => o.key)}
                        />
                    </tbody>
                </table>
            </div>

            <p className="text-[11px] text-slate-400">
                As alterações são salvas localmente no navegador e aplicadas imediatamente nos filtros.
            </p>
        </div>
    );
};
