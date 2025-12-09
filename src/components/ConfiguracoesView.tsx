import React from 'react';
import { User, Shield, Bell, Moon } from 'lucide-react';

export const ConfiguracoesView: React.FC = () => {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Configurações</h2>
                <p className="text-slate-400">Gerencie suas preferências e configurações da conta.</p>
            </div>

            <div className="grid gap-6">
                {/* Perfil Section */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Perfil do Usuário</h3>
                            <p className="text-sm text-slate-400">Gerencie suas informações pessoais</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                                <input type="text" value="Admin User" readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                <input type="email" value="admin@afinz.com.br" readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Preferências do Sistema</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Moon size={20} className="text-purple-400" />
                                <div>
                                    <p className="font-medium text-slate-200">Aparência</p>
                                    <p className="text-xs text-slate-400">Tema escuro ativado</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-emerald-400" />
                                <div>
                                    <p className="font-medium text-slate-200">Notificações</p>
                                    <p className="text-xs text-slate-400">Alertas de campanhas</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Shield size={20} className="text-amber-400" />
                                <div>
                                    <p className="font-medium text-slate-200">Segurança</p>
                                    <p className="text-xs text-slate-400">Logs de acesso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
