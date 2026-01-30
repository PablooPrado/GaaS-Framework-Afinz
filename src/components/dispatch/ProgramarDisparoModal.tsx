import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Tag, User, Info, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { ActivityFormSchema, ActivityFormInput } from '../../schemas/ActivityFormSchema';
import { activityService } from '../../services/activityService';
import { ActivityRow, ActivityStatus } from '../../types/activity';
import { useAppStore } from '../../store/useAppStore';

interface ProgramarDisparoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (activity: ActivityRow) => void;
    editingActivity?: ActivityRow | null; // Renamed from editingDispatch
    activeSegmento: string;
}

/**
 * Modal para criar/editar atividades (GaaS) Unificado
 */
export const ProgramarDisparoModal: React.FC<ProgramarDisparoModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingActivity,
    activeSegmento,
}) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Get historical data from store for autocomplete options
    const activities = useAppStore((state) => state.activities);
    const removeActivity = useAppStore((state) => state.removeActivity);

    const historicalOptions = useMemo(() => {
        const segmentos = new Set<string>();
        const perfisCredito = new Set<string>();
        const ofertas = new Set<string>();
        const ofertas2 = new Set<string>();
        const promocionais = new Set<string>();
        const promocionais2 = new Set<string>();
        const jornadas = new Set<string>();
        const parceiros = new Set<string>();
        const subgrupos = new Set<string>();
        const etapasAquisicao = new Set<string>();
        const produtos = new Set<string>();

        activities.forEach(activity => {
            if (activity.segmento) segmentos.add(activity.segmento);
            if (activity.jornada) jornadas.add(activity.jornada);
            if (activity.oferta) ofertas.add(activity.oferta);

            // Fallback to raw for fields not mapped to top-level or extensions
            if (activity.raw) {
                if (activity.raw['Promocional']) promocionais.add(String(activity.raw['Promocional']));
                if (activity.raw['Oferta 2']) ofertas2.add(String(activity.raw['Oferta 2']));
                if (activity.raw['Promocional 2']) promocionais2.add(String(activity.raw['Promocional 2']));
                if (activity.raw['Perfil de Crédito']) perfisCredito.add(String(activity.raw['Perfil de Crédito']));
                if (activity.raw['Parceiro']) parceiros.add(String(activity.raw['Parceiro']));
                if (activity.raw['Subgrupos']) subgrupos.add(String(activity.raw['Subgrupos']));
                if (activity.raw['Etapa de aquisição']) etapasAquisicao.add(String(activity.raw['Etapa de aquisição']));
                if (activity.raw['Produto']) produtos.add(String(activity.raw['Produto']));
            }
        });

        return {
            segmentos: Array.from(segmentos).sort(),
            perfisCredito: Array.from(perfisCredito).sort(),
            ofertas: Array.from(ofertas).sort(),
            ofertas2: Array.from(ofertas2).sort(),
            promocionais: Array.from(promocionais).sort(),
            promocionais2: Array.from(promocionais2).sort(),
            jornadas: Array.from(jornadas).sort(),
            parceiros: Array.from(parceiros).sort(),
            subgrupos: Array.from(subgrupos).sort(),
            etapasAquisicao: Array.from(etapasAquisicao).sort(),
            produtos: Array.from(produtos).sort(),
        };
    }, [activities]);

    const [formData, setFormData] = useState<ActivityFormInput>({
        bu: '' as 'B2C' | 'B2B2C' | 'Plurix',
        jornada: '',
        activityName: '',
        dataInicio: '',
        dataFim: '',
        horarioDisparo: '10:00',
        perfilCredito: '',
        oferta: '',
        promocional: '',
        oferta2: '',
        promocional2: '',
        parceiro: '',
        subgrupo: '',
        etapaAquisicao: '',
        produto: '',
        baseVolume: '', // Novo campo
        status: 'Rascunho',
    });

    const [selectedSegmento, setSelectedSegmento] = useState(activeSegmento);

    // Preencher form se editando
    useEffect(() => {
        if (editingActivity) {
            setFormData({
                bu: editingActivity.BU as any,
                jornada: editingActivity.jornada,
                activityName: editingActivity['Activity name / Taxonomia'],
                dataInicio: editingActivity['Data de Disparo'],
                dataFim: editingActivity['Data Fim'],
                horarioDisparo: '10:00', // TODO: Save time specifically if needed
                perfilCredito: editingActivity['Perfil de Crédito'] || '',
                oferta: editingActivity.Oferta || '',
                promocional: editingActivity.Promocional || '',
                oferta2: editingActivity['Oferta 2'] || '',
                promocional2: editingActivity['Promocional 2'] || '',
                parceiro: editingActivity.Parceiro || '',
                subgrupo: editingActivity.Subgrupos || '',
                etapaAquisicao: editingActivity['Etapa de aquisição'] || '',
                produto: editingActivity.Produto || '',
                baseVolume: String(editingActivity['Base Total'] || ''),
                status: editingActivity.status,
            });
            setSelectedSegmento(editingActivity.Segmento);
        } else {
            // Reset
            setFormData({
                bu: '' as any,
                jornada: '',
                activityName: '',
                dataInicio: '',
                dataFim: '',
                horarioDisparo: '10:00',
                perfilCredito: '',
                oferta: '',
                promocional: '',
                oferta2: '',
                promocional2: '',
                parceiro: '',
                subgrupo: '',
                etapaAquisicao: '',
                produto: '',
                baseVolume: '',
                status: 'Rascunho',
            });
            setSelectedSegmento(activeSegmento);
            setErrors({});
        }
    }, [editingActivity, isOpen, activeSegmento]);

    // Auto-fill Data Fim
    useEffect(() => {
        if (formData.dataInicio && !editingActivity) {
            const startDate = new Date(formData.dataInicio);
            startDate.setDate(startDate.getDate() + 2);
            const endDate = startDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dataFim: endDate }));
        }
    }, [formData.dataInicio, editingActivity]);

    const handleChange = (field: keyof ActivityFormInput, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (status: ActivityStatus) => {
        try {
            setLoading(true);
            setErrors({});

            const dataToSubmit = { ...formData, status };
            const parseResult = ActivityFormSchema.safeParse(dataToSubmit);

            if (!parseResult.success) {
                const newErrors: Record<string, string> = {};
                // Helper to safely access errors
                parseResult.error.issues.forEach(err => {
                    const field = err.path[0] as string;
                    newErrors[field] = err.message;
                });
                setErrors(newErrors);

                // Show general error message
                setErrors(prev => ({ ...prev, form: 'Verifique os campos obrigatórios em vermelho.' }));

                // Scroll to top of modal content
                const modalContent = document.getElementById('modal-content');
                if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });

                return;
            }

            let savedActivity: ActivityRow;

            if (editingActivity) {
                savedActivity = await activityService.updateActivity(
                    editingActivity.id,
                    {
                        BU: parseResult.data.bu,
                        jornada: parseResult.data.jornada,
                        'Activity name / Taxonomia': parseResult.data.activityName,
                        'Data de Disparo': parseResult.data.dataInicio,
                        'Data Fim': parseResult.data.dataFim,
                        Segmento: selectedSegmento,
                        'Perfil de Crédito': parseResult.data.perfilCredito || null,
                        Oferta: parseResult.data.oferta || null,
                        Promocional: parseResult.data.promocional || null,
                        'Oferta 2': parseResult.data.oferta2 || null,
                        'Promocional 2': parseResult.data.promocional2 || null,
                        Parceiro: parseResult.data.parceiro || null,
                        Subgrupos: parseResult.data.subgrupo || null,
                        'Etapa de aquisição': parseResult.data.etapaAquisicao || null,
                        Produto: parseResult.data.produto || null,
                        'Base Total': Number(formData.baseVolume) || null,
                        status: parseResult.data.status,
                    }
                );
            } else {
                savedActivity = await activityService.saveActivity(
                    parseResult.data,
                    selectedSegmento
                );
            }

            onSuccess(savedActivity);
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar atividade:', error);
            const msg = error?.message || error?.error_description || 'Erro desconhecido';
            setErrors({ form: `Erro ao salvar: ${msg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingActivity || !window.confirm('Tem certeza que deseja apagar esta atividade?')) return;

        try {
            setLoading(true);
            await activityService.deleteActivity(editingActivity.id);
            removeActivity(editingActivity.id);
            onClose();
        } catch (error) {
            console.error('Erro ao apagar:', error);
            setErrors({ form: 'Erro ao apagar atividade da base.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl m-4 border border-slate-700">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">
                        {editingActivity ? 'Editar Atividade' : 'Programar Nova Atividade'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {errors.form && (
                    <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm">
                        {errors.form}
                    </div>
                )}

                <div id="modal-content" className="p-5 grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[75vh] overflow-y-auto">
                    {/* Column 1: Identificação */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700 uppercase tracking-wider">
                            Identificação <span title="Informações básicas para identificar este disparo no sistema"><Info size={14} className="text-slate-500 opacity-50" /></span>
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    BU * <span title="Unidade de Negócio responsável"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <select
                                    value={formData.bu}
                                    onChange={(e) => handleChange('bu', e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-sm text-white focus:ring-1 focus:ring-blue-500 ${errors.bu ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}`}
                                >
                                    <option value="">Selecione</option>
                                    <option value="B2C">B2C</option>
                                    <option value="B2B2C">B2B2C</option>
                                    <option value="Plurix">Plurix</option>
                                </select>
                                {errors.bu && <span className="text-red-400 text-xs mt-1 block">{errors.bu}</span>}
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Segmento * <span title="Público alvo do disparo"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <select
                                    value={selectedSegmento}
                                    onChange={(e) => setSelectedSegmento(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white hover:border-slate-600"
                                >
                                    <option value="">Selecione</option>
                                    {historicalOptions.segmentos.map(seg => (
                                        <option key={seg} value={seg}>{seg}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Parceiro <span title="Nome do parceiro associado (ex: Afinz, Pluxee)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <input
                                    list="parceiros-list"
                                    value={formData.parceiro}
                                    onChange={(e) => handleChange('parceiro', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    placeholder="Ex: Afinzed..."
                                />
                                <datalist id="parceiros-list">
                                    {historicalOptions.parceiros.map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Subgrupo <span title="Nível adicional de segmentação"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <input
                                    list="subgrupos-list"
                                    value={formData.subgrupo}
                                    onChange={(e) => handleChange('subgrupo', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    placeholder="Ex: Ativos, Novos..."
                                />
                                <datalist id="subgrupos-list">
                                    {historicalOptions.subgrupos.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Jornada * <span title="Fluxo de comunicação ao qual este disparo pertence"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <input
                                    list="jornadas-list"
                                    value={formData.jornada}
                                    onChange={(e) => handleChange('jornada', e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-sm text-white ${errors.jornada ? 'border-red-500' : 'border-slate-700'}`}
                                    placeholder="Selecione ou digite..."
                                />
                                <datalist id="jornadas-list">
                                    {historicalOptions.jornadas.map(j => <option key={j} value={j} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Activity Name * <span title="Nome técnico único para o disparo (taxonomia)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.activityName}
                                    onChange={(e) => handleChange('activityName', e.target.value)}
                                    placeholder="campanha_reativacao_2026"
                                    className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-sm text-white font-mono ${errors.activityName ? 'border-red-500' : 'border-slate-700'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Período & Ofertas */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700 uppercase tracking-wider">
                            Volume & Ofertas <span title="Definição de prazos, quantidade e ofertas comerciais"><Info size={14} className="text-slate-500 opacity-50" /></span>
                        </h3>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Início * <span title="Data prevista do disparo"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dataInicio}
                                        onChange={(e) => handleChange('dataInicio', e.target.value)}
                                        className="w-full px-2 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Fim * <span title="Data limite para análise de conversão"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dataFim}
                                        onChange={(e) => handleChange('dataFim', e.target.value)}
                                        className="w-full px-2 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-bold text-indigo-400">
                                        Volume <span title="Quantidade total de clientes na base do disparo"><Info size={12} className="text-indigo-500/50 cursor-help" /></span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.baseVolume}
                                        onChange={(e) => handleChange('baseVolume', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Horário <span title="Hora agendada para o envio"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.horarioDisparo}
                                        onChange={(e) => handleChange('horarioDisparo', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Perfil Crédito <span title="Regra de aprovação/crédito aplicada"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <select
                                    value={formData.perfilCredito}
                                    onChange={(e) => handleChange('perfilCredito', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                >
                                    <option value="">Selecione</option>
                                    {historicalOptions.perfisCredito.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Oferta * <span title="Principal oferta da campanha"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        list="ofertas-list"
                                        value={formData.oferta}
                                        onChange={(e) => handleChange('oferta', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Promocional <span title="Cupom ou benefício extra"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        list="promocionais-list"
                                        value={formData.promocional}
                                        onChange={(e) => handleChange('promocional', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Oferta 2 <span title="Oferta secundária/A|B"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        list="ofertas2-list"
                                        value={formData.oferta2}
                                        onChange={(e) => handleChange('oferta2', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Promocional 2 <span title="Benefício extra da segunda oferta"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        list="promocionais2-list"
                                        value={formData.promocional2}
                                        onChange={(e) => handleChange('promocional2', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Analytics / Insights */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 pb-2 border-b border-indigo-500/30 uppercase tracking-wider">
                            Inteligência <span title="Predições baseadas em inteligência artificial e dados históricos"><Info size={14} className="text-indigo-400/50 opacity-50" /></span>
                        </h3>

                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    Analytics Engine <span title="Motor científico que analisa o desempenho das jornadas passadas"><Info size={10} className="text-indigo-500/50" /></span>
                                </h4>
                                <div className="text-[8px] bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-800 font-mono">
                                    GAAS v2.4
                                </div>
                            </div>

                            {!formData.jornada ? (
                                <div className="py-8 text-center space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mx-auto opacity-50">
                                        <TrendingUp size={14} className="text-slate-600" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic px-4 leading-relaxed">
                                        Aguardando a definição de uma **Jornada** para gerar sugestões preditivas...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {historicalOptions.jornadas.filter(j =>
                                        formData.jornada && j.toLowerCase().includes(formData.jornada.toLowerCase())
                                    ).slice(0, 2).map(match => {
                                        const matches = activities.filter(a => a.jornada === match);
                                        const historicalMatch = matches[0];
                                        if (!historicalMatch) return null;

                                        const avgConv = matches.reduce((sum, a) => sum + (a.kpis?.taxaConversao || 0), 0) / matches.length;
                                        const baseVol = Number(formData.baseVolume) || 0;
                                        const predictedCards = Math.round(baseVol * (avgConv / 100));

                                        return (
                                            <button
                                                key={match}
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        jornada: match,
                                                        parceiro: historicalMatch.parceiro || prev.parceiro,
                                                        perfilCredito: historicalMatch.raw?.['Perfil de Crédito'] || prev.perfilCredito,
                                                        etapaAquisicao: historicalMatch.raw?.['Etapa de aquisição'] || prev.etapaAquisicao,
                                                        produto: historicalMatch.raw?.['Produto'] || prev.produto,
                                                        oferta: historicalMatch.oferta || prev.oferta,
                                                        bu: historicalMatch.bu as any,
                                                    }));
                                                    setSelectedSegmento(historicalMatch.segmento);
                                                }}
                                                className="w-full text-left bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-2.5">
                                                    <span className="font-bold text-slate-200 text-xs truncate max-w-[140px] block">{match}</span>
                                                    <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Aplicar</span>
                                                </div>

                                                <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 mb-2.5">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Predição</span>
                                                        <span className="text-[11px] text-emerald-400 font-bold">~{predictedCards} cartões</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                        <div className="bg-emerald-500 h-full" style={{ width: '65%' }} />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                                                    <span>Histórico: {matches.length}x</span>
                                                    <div className="flex items-center gap-1.5 text-indigo-400">
                                                        <Info size={10} />
                                                        <span>Confiança: {avgConv > 0.1 ? 'Alta' : 'Média'}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
                    {editingActivity && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all text-xs font-bold uppercase tracking-wider mr-auto"
                        >
                            <Trash2 size={14} />
                            Excluir
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('Rascunho')}
                        disabled={loading}
                        className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-bold shadow-lg shadow-black/20"
                    >
                        {loading ? 'Salvando...' : 'Salvar Rascunho'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('Scheduled')}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-bold shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                    >
                        {loading ? 'Agendando...' : 'Agendar & Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
