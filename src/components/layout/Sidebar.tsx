import React from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    Lightbulb,
    BookOpen,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useBU, BU } from '../../contexts/BUContext';

interface SidebarProps {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
    const { viewSettings, setTab } = useAppStore();
    const activeTab = viewSettings.abaAtual;
    const { toggleBU, isBUSelected } = useBU();

    const menuGroups = [
        {
            title: 'PLANEJAMENTO',
            items: [
                { id: 'launch', label: 'Launch Planner', icon: Calendar },
                { id: 'diario', label: 'Diário de Bordo', icon: BookOpen },
            ]
        },
        {
            title: 'ANÁLISE',
            items: [
                { id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp },
                { id: 'resultados', label: 'Resultados', icon: BarChart3 },
                { id: 'orientador', label: 'Orientador', icon: Lightbulb },
            ]
        },
        {
            title: 'SISTEMA',
            items: [
                { id: 'framework', label: 'Framework', icon: LayoutDashboard },
            ]
        }
    ] as const;

    const buOptions: { id: BU; label: string; color: string }[] = [
        { id: 'B2C', label: 'B2C', color: 'bg-blue-500' },
        { id: 'B2B2C', label: 'B2B2C', color: 'bg-emerald-500' },
        { id: 'Plurix', label: 'Plurix', color: 'bg-purple-500' },
    ];

    return (
        <aside className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full ${className}`}>
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {menuGroups.map((group, idx) => (
                    <div key={idx}>
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            {group.title}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${activeTab === item.id
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                                        }`}
                                >
                                    <item.icon size={18} className={activeTab === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                                    {item.label}
                                    {activeTab === item.id && (
                                        <ChevronRight size={14} className="ml-auto text-blue-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* BU Selector Section */}
                <div>
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Business Units
                    </p>
                    <div className="space-y-1">
                        {buOptions.map((bu) => (
                            <button
                                key={bu.id}
                                onClick={() => toggleBU(bu.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isBUSelected(bu.id)
                                    ? 'bg-slate-800 text-slate-200'
                                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${bu.color} ${isBUSelected(bu.id) ? 'shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'opacity-50'}`} />
                                    <span>{bu.label}</span>
                                </div>
                                {isBUSelected(bu.id) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer / Settings - Settings moved to Header */}
            <div className="p-4 border-t border-slate-800 pb-8">
                {/* Empty for now or future footer items */}
            </div>
        </aside>
    );
};
