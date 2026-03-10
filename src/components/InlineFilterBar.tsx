import React from 'react';
import { MessageCircle, Map, Users, HeartHandshake, ChevronDown, Check, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FilterState } from '../types/framework';
import { PeriodSelector } from './period-selector/PeriodSelector';

interface InlineFilterBarProps {
    availableCanais?: string[];
    availableJornadas?: string[];
    availableSegmentos?: string[];
    availableParceiros?: string[];
    countByCanal?: { [canal: string]: number };
    countByJornada?: { [jornada: string]: number };
    countBySegmento?: { [segmento: string]: number };
    countByParceiro?: { [parceiro: string]: number };
}

interface FilterDropdownProps {
    title: string;
    icon: any;
    items: string[];
    field: keyof FilterState;
    counts: Record<string, number>;
    align?: 'left' | 'right';
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ title, icon: Icon, items, field, counts, align = 'left' }) => {
    const { viewSettings, setGlobalFilters } = useAppStore();
    const filters = viewSettings.filtrosGlobais;
    const [isOpen, setIsOpen] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    if (items.length === 0) return null;

    const toggleItem = (value: string) => {
        const currentList = filters[field] as string[];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];
        setGlobalFilters({ [field]: newList });
    };

    const toggleAll = () => {
        const currentList = filters[field] as string[];
        const allSelected = items.length > 0 && items.every(i => currentList.includes(i));
        if (allSelected) {
            const newList = currentList.filter(i => !items.includes(i));
            setGlobalFilters({ [field]: newList });
        } else {
            const toAdd = items.filter(i => !currentList.includes(i));
            setGlobalFilters({ [field]: [...currentList, ...toAdd] });
        }
    };

    const isAllSelected = items.length > 0 && items.every(i => (filters[field] as string[]).includes(i));
    const selectedCount = (filters[field] as string[]).length;
    const isActive = selectedCount > 0;

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300); // 300ms hover delay bridge
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className={`flex items-center gap-2 px-3 py-2 rounded-lg transition border shadow-sm ${isActive || isOpen
                ? 'bg-white border-slate-400 text-slate-800'
                : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600'
                }`}>
                <Icon size={16} className={isActive ? 'text-slate-600' : 'text-slate-400'} />
                <span className="text-sm font-medium">{title}</span>
                {isActive && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1 border border-slate-300">
                        {selectedCount}
                    </span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 opacity-100' : 'opacity-50'}`} />
            </button>

            {/* A wrapper with dropdown items. We add an invisible safe zone to trap the mouse */}
            <div className={`absolute top-full pt-1.5 min-w-64 max-w-sm z-50 transition-all duration-200 transform origin-top-left ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-1 pointer-events-none'
                } ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
                {/* INVISIBLE BRIDGE to prevent mouse slip */}
                <div
                    className="absolute -inset-x-8 -top-3 -bottom-8 bg-transparent -z-10"
                    aria-hidden="true"
                />

                <div className="bg-white border border-slate-200 rounded-xl shadow-[0_12px_45px_-8px_rgba(0,0,0,0.2)] p-2 relative overflow-hidden ring-1 ring-slate-900/5">
                    <div className="flex items-center justify-between px-3 py-2.5 mb-1 border-b border-slate-100 bg-slate-50/80 -mx-2 -mt-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
                        <button
                            onClick={toggleAll}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-colors"
                        >
                            {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-0.5 custom-scrollbar py-1">
                        {items.map(item => {
                            const selected = (filters[field] as string[]).includes(item);
                            return (
                                <label
                                    key={item}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleItem(item);
                                    }}
                                    className="flex items-center gap-3 cursor-pointer px-2 py-2 hover:bg-slate-50/80 rounded-lg transition group/item"
                                >
                                    <div className={`w-4 h-4 rounded shadow-sm flex items-center justify-center transition ${selected
                                        ? 'bg-blue-600 border-transparent text-white'
                                        : 'bg-white border text-transparent border-slate-300 group-hover/item:border-blue-400'
                                        }`}>
                                        <Check size={12} strokeWidth={3} className={selected ? "opacity-100" : "opacity-0"} />
                                    </div>
                                    <span className={`text-sm truncate flex-1 font-medium leading-none mt-0.5 transition-colors ${selected ? 'text-slate-800' : 'text-slate-600'}`}>{item}</span>
                                    <span className="text-slate-400 text-xs tabular-nums bg-slate-50 border border-slate-100 rounded px-1 group-hover/item:bg-white transition-colors">{counts[item] || 0}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InlineFilterBar: React.FC<InlineFilterBarProps> = ({
    availableCanais = [],
    availableJornadas = [],
    availableSegmentos = [],
    availableParceiros = [],
    countByCanal = {},
    countByJornada = {},
    countBySegmento = {},
    countByParceiro = {}
}) => {
    const { viewSettings, setGlobalFilters } = useAppStore();
    const filters = viewSettings.filtrosGlobais;

    const clearFilters = () => {
        setGlobalFilters({
            canais: [],
            segmentos: [],
            parceiros: [],
            ofertas: [],
            disparado: 'Todos'
        });
    };

    const hasActiveFilters = filters.canais.length > 0 || filters.jornadas.length > 0 || filters.segmentos.length > 0 || filters.parceiros.length > 0;

    return (
        <div className="flex items-center gap-2">
            <PeriodSelector compact />
            <FilterDropdown
                title="Canais"
                icon={MessageCircle}
                items={availableCanais}
                field="canais"
                counts={countByCanal}
            />
            <FilterDropdown
                title="Jornadas"
                icon={Map}
                items={availableJornadas}
                field="jornadas"
                counts={countByJornada}
            />
            <FilterDropdown
                title="Segmentos"
                icon={Users}
                items={availableSegmentos}
                field="segmentos"
                counts={countBySegmento}
            />
            <FilterDropdown
                title="Parceiros"
                icon={HeartHandshake}
                items={availableParceiros}
                field="parceiros"
                counts={countByParceiro}
                align="right"
            />

            {hasActiveFilters && (
                <div className="h-6 w-px bg-slate-200 mx-2" />
            )}

            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                    <X size={14} />
                    Limpar
                </button>
            )}
        </div>
    );
};
