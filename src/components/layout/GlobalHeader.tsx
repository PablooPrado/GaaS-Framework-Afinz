import React from 'react';
import { Bell, User, Search, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const GlobalHeader: React.FC = () => {
    const { setTab } = useAppStore();

    return (
        <header className="h-16 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50">
            {/* Left: Search */}
            <div className="flex items-center w-1/3">
                <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-64 transition-all focus-within:w-80 focus-within:bg-white/10 focus-within:border-blue-500/50">
                    <Search size={16} className="text-slate-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-sm text-slate-300 w-full placeholder-slate-600"
                    />
                </div>
            </div>

            {/* Center: Logo/Brand */}
            <div className="flex flex-col items-center justify-center w-1/3">
                <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-bold text-xl tracking-tight">
                    Dashboard Growth CRM
                </h1>
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                    Afinz v3.0
                </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-4 w-1/3">
                <button
                    onClick={() => setTab('configuracoes')}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition relative"
                    title="Configurações"
                >
                    {/* Placeholder for Settings Icon interaction if needed, for now just visual */}
                    <Settings size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0B0F19]"></span>
                </button>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition group">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center ring-2 ring-white/10 group-hover:ring-blue-500/50 transition-all">
                        <User size={16} className="text-white" />
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Admin User</p>
                        <p className="text-xs text-slate-500">Growth Team</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
