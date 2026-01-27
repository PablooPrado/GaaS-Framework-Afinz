import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const LoginView: React.FC = () => {
    const { signInWithEmail, loading } = useAuth();
    const [emailInput, setEmailInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setError(null);
        try {
            await signInWithEmail(emailInput);
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
    }

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/30 transform rotate-3">
                        <User size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Login Corporativo</h2>
                    <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                        Acesse a área segura para sincronizar dados e gerenciar arquivos na nuvem.
                    </p>

                    {sent ? (
                        <div className="bg-emerald-500/10 text-emerald-400 p-6 rounded-xl text-sm border border-emerald-500/20 animate-fade-in text-left">
                            <div className="flex items-center gap-2 mb-2 font-bold text-emerald-300">
                                <CheckCircle size={18} />
                                <span>Link Enviado!</span>
                            </div>
                            <p className="mb-2">Enviamos um link de acesso mágico para:</p>
                            <code className="block bg-black/20 p-2 rounded text-emerald-200 mb-4 font-mono">{emailInput}</code>
                            <p className="text-xs opacity-80">Verifique sua caixa de entrada (e spam) e clique no link para entrar.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="text-left group">
                                <label className="block text-xs font-bold text-blue-400 uppercase mb-2 tracking-wider ml-1">Email <span className="opacity-50">(@afinz.com.br)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                        placeholder="seu.nome@afinz.com.br"
                                        value={emailInput}
                                        onChange={e => setEmailInput(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-xs text-red-200 bg-red-500/20 p-3 rounded-lg flex items-center gap-2 border border-red-500/30">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSending}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>
                                        Receber Link de Acesso
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-1.5 opacity-60">
                        <ShieldCheck size={12} />
                        Ambiente Seguro & Criptografado
                    </p>
                </div>
            </div>
        </div>
    );
};
