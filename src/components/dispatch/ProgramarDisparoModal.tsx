import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Tag, User, Info, Trash2, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { ActivityFormSchema, ActivityFormInput } from '../../schemas/ActivityFormSchema';
import { activityService } from '../../services/activityService';
import { ActivityRow, ActivityStatus } from '../../types/activity';
import { useAppStore } from '../../store/useAppStore';
import {
    CANAIS,
    PRODUTOS,
    ETAPAS_AQUISICAO,
    CUSTO_UNITARIO_CANAL,
    CUSTO_UNITARIO_OFERTA,
    generateSafra,
    calculateOrdemDisparo,
    suggestActivityName,
    calcularCustoTotalOferta,
    calcularCustoTotalCanal,
    calcularCustoTotalCampanha,
    calcularCACPrevisto
} from '../../constants/frameworkFields';
import {
    calculateProjections,
    ProjectionResult,
    suggestFieldsBasedOnHistory
} from '../../utils/intelligentSuggestions';

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
        const canais = new Set<string>();

        activities.forEach(activity => {
            if (activity.segmento) segmentos.add(activity.segmento);
            if (activity.jornada) jornadas.add(activity.jornada);
            if (activity.oferta) ofertas.add(activity.oferta);
            if (activity['Canal']) canais.add(activity['Canal']);

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
            canais: Array.from(canais).sort(),
        };
    }, [activities]);

    const [formData, setFormData] = useState<ActivityFormInput>({
        bu: '' as 'B2C' | 'B2B2C' | 'Plurix',
        jornada: '',
        activityName: '',
        dataInicio: '',
        dataFim: '',
        horarioDisparo: '10:00',
        canal: '' as any, // Novo campo obrigatório
        perfilCredito: '',
        oferta: '',
        promocional: '',
        oferta2: '',
        promocional2: '',
        parceiro: '',
        subgrupo: '',
        etapaAquisicao: '',
        produto: 'Classic', // Novo campo com padrão
        baseVolume: '',
        // Campos auto-calculados
        safra: '',
        ordemDisparo: 1,
        // Campos de custo
        custoUnitarioOferta: '',
        custoTotalOferta: '',
        custoUnitarioCanal: '',
        custoTotalCanal: '',
        custoTotalCampanha: '',
        status: 'Rascunho',
    });

    const [selectedSegmento, setSelectedSegmento] = useState(activeSegmento);

    // Estado para Engines de IA
    const [projections, setProjections] = useState<Record<string, ProjectionResult>>({});
    const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

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
                canal: (editingActivity.Canal || '') as any,
                perfilCredito: editingActivity['Perfil de Crédito'] || '',
                oferta: editingActivity.Oferta || '',
                promocional: editingActivity.Promocional || '',
                oferta2: editingActivity['Oferta 2'] || '',
                promocional2: editingActivity['Promocional 2'] || '',
                parceiro: editingActivity.Parceiro || '',
                subgrupo: editingActivity.Subgrupos || '',
                etapaAquisicao: editingActivity['Etapa de aquisição'] || '',
                produto: editingActivity.Produto || 'Classic',
                baseVolume: String(editingActivity['Base Total'] || ''),
                safra: editingActivity.Safra || '',
                ordemDisparo: editingActivity['Ordem de disparo'] || 1,
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
                canal: '' as any,
                perfilCredito: '',
                oferta: '',
                promocional: '',
                oferta2: '',
                promocional2: '',
                parceiro: '',
                subgrupo: '',
                etapaAquisicao: '',
                produto: 'Classic',
                baseVolume: '',
                safra: '',
                ordemDisparo: 1,
                custoUnitarioOferta: '',
                custoTotalOferta: '',
                custoUnitarioCanal: '',
                custoTotalCanal: '',
                custoTotalCampanha: '',
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

    // AUTO-CÁLCULO: Safra (baseado em Data Início)
    useEffect(() => {
        if (formData.dataInicio) {
            const safra = generateSafra(formData.dataInicio);
            setFormData(prev => ({ ...prev, safra }));
        }
    }, [formData.dataInicio]);

    // AUTO-CÁLCULO: Ordem de Disparo (baseado em jornada + data)
    useEffect(() => {
        if (formData.jornada && formData.dataInicio && !editingActivity) {
            const ordem = calculateOrdemDisparo(formData.jornada, formData.dataInicio, activities);
            setFormData(prev => ({ ...prev, ordemDisparo: ordem }));
        }
    }, [formData.jornada, formData.dataInicio, activities, editingActivity]);

    // AUTO-SUGESTÃO: Activity Name (quando campos-chave mudam)
    useEffect(() => {
        if (formData.bu && selectedSegmento && formData.jornada && formData.safra && formData.ordemDisparo && !editingActivity) {
            const suggestedName = suggestActivityName(
                formData.bu,
                selectedSegmento,
                formData.jornada,
                formData.ordemDisparo || 1,
                formData.safra
            );
            if (suggestedName && !formData.activityName) {
                setFormData(prev => ({ ...prev, activityName: suggestedName }));
            }
        }
    }, [formData.bu, selectedSegmento, formData.jornada, formData.safra, formData.ordemDisparo, editingActivity]);

    // AUTO-CÁLCULO: Custo Unitário do Canal (quando canal muda)
    useEffect(() => {
        if (formData.canal && CUSTO_UNITARIO_CANAL[formData.canal]) {
            const custoUnit = CUSTO_UNITARIO_CANAL[formData.canal];
            setFormData(prev => ({
                ...prev,
                custoUnitarioCanal: String(custoUnit.toFixed(3))
            }));
        }
    }, [formData.canal]);

    // AUTO-CÁLCULO: Custo Unitário da Oferta (quando oferta muda)
    useEffect(() => {
        if (formData.oferta && CUSTO_UNITARIO_OFERTA[formData.oferta]) {
            const custoUnit = CUSTO_UNITARIO_OFERTA[formData.oferta];
            setFormData(prev => ({
                ...prev,
                custoUnitarioOferta: String(custoUnit.toFixed(2))
            }));
        }
    }, [formData.oferta]);

    // AUTO-CÁLCULO: Custos Totais (quando unitários ou base mudam)
    useEffect(() => {
        const baseVol = Number(formData.baseVolume) || 0;
        const custoUnitOferta = Number(formData.custoUnitarioOferta) || 0;
        const custoUnitCanal = Number(formData.custoUnitarioCanal) || 0;

        if (baseVol > 0) {
            const custoTotalOf = calcularCustoTotalOferta(custoUnitOferta, baseVol);
            const custoTotalCan = calcularCustoTotalCanal(custoUnitCanal, baseVol);
            const custoTotalCamp = calcularCustoTotalCampanha(custoTotalOf, custoTotalCan);

            setFormData(prev => ({
                ...prev,
                custoTotalOferta: String(custoTotalOf.toFixed(2)),
                custoTotalCanal: String(custoTotalCan.toFixed(2)),
                custoTotalCampanha: String(custoTotalCamp.toFixed(2)),
            }));
        }
    }, [formData.baseVolume, formData.custoUnitarioOferta, formData.custoUnitarioCanal]);

    // PROJEÇÕES IA: Calcular quando campos-chave mudam
    useEffect(() => {
        if (formData.bu && selectedSegmento && activities.length > 0 && !editingActivity) {
            try {
                const projectionInput = {
                    bu: formData.bu,
                    segmento: selectedSegmento,
                    perfilCredito: formData.perfilCredito,
                    canal: formData.canal,
                    baseVolume: Number(formData.baseVolume) || undefined
                };

                const results = calculateProjections(activities, projectionInput);
                setProjections(results);
            } catch (error) {
                console.error('Erro ao calcular projeções:', error);
                setProjections({});
            }
        } else {
            setProjections({});
        }
    }, [formData.bu, selectedSegmento, formData.perfilCredito, formData.canal, formData.baseVolume, activities, editingActivity]);

    // SUGESTÕES AUTOMÁTICAS: Preencher campos baseado no histórico
    useEffect(() => {
        if (!editingActivity && formData.bu && selectedSegmento && formData.jornada && activities.length > 0) {
            try {
                const suggestions = suggestFieldsBasedOnHistory(activities, {
                    bu: formData.bu,
                    segmento: selectedSegmento,
                    jornada: formData.jornada,
                    parceiro: formData.parceiro || undefined
                });

                // Auto-preencher campos vazios
                setFormData(prev => ({
                    ...prev,
                    // Subgrupo
                    subgrupo: prev.subgrupo || (suggestions.subgrupo?.[0]?.value ? String(suggestions.subgrupo[0].value) : ''),
                    // Ofertas
                    oferta: prev.oferta || (suggestions.oferta?.[0]?.value ? String(suggestions.oferta[0].value) : ''),
                    promocional: prev.promocional || (suggestions.promocional?.[0]?.value ? String(suggestions.promocional[0].value) : ''),
                    // Ofertas secundárias
                    oferta2: prev.oferta2 || (suggestions.oferta2?.[0]?.value ? String(suggestions.oferta2[0].value) : ''),
                    promocional2: prev.promocional2 || (suggestions.promocional2?.[0]?.value ? String(suggestions.promocional2[0].value) : ''),
                    // Perfil Crédito
                    perfilCredito: prev.perfilCredito || (suggestions.perfilCredito?.[0]?.value ? String(suggestions.perfilCredito[0].value) : '')
                }));

                console.log('✨ Sugestões IA aplicadas:', suggestions);
            } catch (error) {
                console.error('Erro ao gerar sugestões:', error);
            }
        }
    }, [formData.bu, selectedSegmento, formData.jornada, formData.parceiro, activities, editingActivity]);

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
            <div className="relative bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl m-4 border border-slate-700">

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

                <div id="modal-content" className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-h-[80vh] overflow-y-auto">
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
                                {errors.activityName && <span className="text-red-400 text-xs mt-1 block">{errors.activityName}</span>}
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Canal * <span title="Meio de comunicação utilizado para o disparo (E-mail, SMS, Push, WhatsApp)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <select
                                    value={formData.canal}
                                    onChange={(e) => handleChange('canal', e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-sm text-white focus:ring-1 focus:ring-blue-500 ${errors.canal ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}`}
                                >
                                    <option value="">Selecione</option>
                                    {/* Priorizar histórico se houver, senão usar constantes FRAMEWORK */}
                                    {(historicalOptions.canais.length > 0 ? historicalOptions.canais : CANAIS).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {errors.canal && <span className="text-red-400 text-xs mt-1 block">{errors.canal}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Timeline & Volume */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700 uppercase tracking-wider">
                            Timeline & Volume <span title="Datas, horários e volume de disparos planejados"><Info size={14} className="text-slate-500 opacity-50" /></span>
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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Safra <span title="Mês/ano de agrupamento operacional (gerado automaticamente a partir da Data de Disparo)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.safra}
                                        readOnly
                                        className="w-full px-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                                        placeholder="Ex: jan/26"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Ordem <span title="Sequência automática deste disparo dentro da jornada (calculado pelo sistema)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.ordemDisparo}
                                        readOnly
                                        className="w-full px-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Column 3: Ofertas & Produto */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700 uppercase tracking-wider">
                            Ofertas & Produto <span title="Ofertas comerciais e configurações de produto"><Info size={14} className="text-slate-500 opacity-50" /></span>
                        </h3>

                        <div className="space-y-3">
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
                                        placeholder="Ex: Vibe"
                                    />
                                    <datalist id="ofertas-list">
                                        {historicalOptions.ofertas.map(o => <option key={o} value={o} />)}
                                    </datalist>
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
                                        placeholder="Ex: Padrão"
                                    />
                                    <datalist id="promocionais-list">
                                        {historicalOptions.promocionais.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Oferta 2 <span title="Oferta secundária para testes A/B"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        list="ofertas2-list"
                                        value={formData.oferta2}
                                        onChange={(e) => handleChange('oferta2', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                        placeholder="Opcional"
                                    />
                                    <datalist id="ofertas2-list">
                                        {historicalOptions.ofertas2.map(o => <option key={o} value={o} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                        Promocional 2 <span title="Cupom secundário para testes"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                    </label>
                                    <input
                                        list="promocionais2-list"
                                        value={formData.promocional2}
                                        onChange={(e) => handleChange('promocional2', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                        placeholder="Opcional"
                                    />
                                    <datalist id="promocionais2-list">
                                        {historicalOptions.promocionais2.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 4: Configuração */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700 uppercase tracking-wider">
                            Configuração <span title="Produto, perfil e etapa do funil"><Info size={14} className="text-slate-500 opacity-50" /></span>
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Produto <span title="Produto financeiro oferecido (Classic é o padrão)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <select
                                    value={formData.produto}
                                    onChange={(e) => handleChange('produto', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                >
                                    <option value="">Selecione</option>
                                    {historicalOptions.produtos.length > 0 ? (
                                        historicalOptions.produtos.map(p => <option key={p} value={p}>{p}</option>)
                                    ) : (
                                        PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                                    Etapa Aquisição <span title="Fase do funil de conversão (Aquisição ou Meio de Funil)"><Info size={12} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <select
                                    value={formData.etapaAquisicao}
                                    onChange={(e) => handleChange('etapaAquisicao', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                                >
                                    <option value="">Selecione</option>
                                    {historicalOptions.etapasAquisicao.length > 0 ? (
                                        historicalOptions.etapasAquisicao.map(e => <option key={e} value={e}>{e}</option>)
                                    ) : (
                                        ETAPAS_AQUISICAO.map(e => <option key={e} value={e}>{e}</option>)
                                    )}
                                </select>
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

                            <div>
                                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-bold text-indigo-400">
                                    Volume <span title="Quantidade total de clientes na base"><Info size={12} className="text-indigo-500/50 cursor-help" /></span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.baseVolume}
                                    onChange={(e) => handleChange('baseVolume', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-indigo-500/30 rounded-lg text-sm text-white"
                                    placeholder="Ex: 50000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção Expandida: Investimento (abaixo do grid) */}
                <div className="px-6 pb-4">
                    {/* Column 4 content moved here as expanded section */}
                    <div className="space-y-4">
                        {/* SEÇÃO 1: INVESTIMENTO (CUSTOS) */}
                        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 pb-2 border-b border-emerald-500/30 uppercase tracking-wider">
                            <DollarSign size={14} /> Investimento <span title="Custos planejados para cálculo de ROI e CAC (opcional ao programar)"><Info size={14} className="text-emerald-400/50 cursor-help" /></span>
                        </h3>

                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-2.5">
                            {/* Custo Unitário Oferta */}
                            <div>
                                <label className="text-[10px] text-slate-400 mb-1 block flex items-center gap-1">
                                    Custo Unit. Oferta (R$) <span title="Custo por cliente da oferta comercial (ex: R$ 0,00 / R$ 1,00 / R$ 2,00 / R$ 76,50)"><Info size={9} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.custoUnitarioOferta}
                                    onChange={(e) => handleChange('custoUnitarioOferta', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-xs text-white"
                                    placeholder="Auto-sugerido"
                                />
                            </div>

                            {/* Custo Total Oferta (read-only) */}
                            <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Custo Total Oferta (R$)</label>
                                <input
                                    type="text"
                                    value={formData.custoTotalOferta ? `R$ ${Number(formData.custoTotalOferta).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                                    readOnly
                                    className="w-full px-2 py-1.5 bg-slate-900/70 border border-slate-600 rounded text-xs text-emerald-400 cursor-not-allowed font-bold"
                                    placeholder="Calculado"
                                />
                            </div>

                            {/* Custo Unitário Canal */}
                            <div>
                                <label className="text-[10px] text-slate-400 mb-1 block flex items-center gap-1">
                                    Custo Unit. Canal (R$) <span title="Custo por mensagem do canal selecionado (E-mail R$ 0,001 / SMS R$ 0,064 / WhatsApp R$ 0,420)"><Info size={9} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.custoUnitarioCanal}
                                    onChange={(e) => handleChange('custoUnitarioCanal', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-xs text-white"
                                    placeholder="Auto-sugerido"
                                />
                            </div>

                            {/* Custo Total Canal (read-only) */}
                            <div>
                                <label className="text-[10px] text-slate-400 mb-1 block">Custo Total Canal (R$)</label>
                                <input
                                    type="text"
                                    value={formData.custoTotalCanal ? `R$ ${Number(formData.custoTotalCanal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                                    readOnly
                                    className="w-full px-2 py-1.5 bg-slate-900/70 border border-slate-600 rounded text-xs text-emerald-400 cursor-not-allowed font-bold"
                                    placeholder="Calculado"
                                />
                            </div>

                            {/* Custo Total Campanha (read-only, destaque) */}
                            <div className="pt-2 border-t border-slate-700">
                                <label className="text-[10px] text-emerald-400 mb-1 block font-bold">Custo Total Campanha (R$)</label>
                                <input
                                    type="text"
                                    value={formData.custoTotalCampanha ? `R$ ${Number(formData.custoTotalCampanha).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                                    readOnly
                                    className="w-full px-2 py-2 bg-emerald-500/10 border border-emerald-500 rounded text-sm text-emerald-300 cursor-not-allowed font-bold text-center"
                                    placeholder="R$ 0,00"
                                />
                            </div>

                            {/* CAC Previsto */}
                            <div>
                                <label className="text-[10px] text-slate-400 mb-1 block flex items-center gap-1">
                                    CAC Previsto <span title="Custo de Aquisição por Cartão previsto (Custo Total ÷ Cartões esperados)"><Info size={9} className="text-slate-500 cursor-help" /></span>
                                </label>
                                <div className="text-emerald-400 text-lg font-bold text-center py-2 bg-slate-900/50 rounded border border-emerald-500/20">
                                    R$ {calcularCACPrevisto(
                                        Number(formData.custoTotalCampanha) || 0,
                                        Math.round((Number(formData.baseVolume) || 0) * 0.05) // Assumindo 5% taxa conversão padrão
                                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 2: PROJEÇÃO (renomeado de Inteligência) */}
                        <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 pb-2 border-b border-indigo-500/30 uppercase tracking-wider mt-6">
                            <TrendingUp size={14} /> Projeção <span title="Engine de IA que busca disparos similares (BU + Segmento + Perfil Crédito + Canal) nos últimos 90 dias e projeta métricas com base em médias/medianas ponderadas por volume e decaimento temporal"><Info size={14} className="text-indigo-400/50 cursor-help" /></span>
                        </h3>

                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 space-y-2.5">
                            {Object.keys(projections).length === 0 ? (
                                <div className="py-6 text-center space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mx-auto opacity-50">
                                        <TrendingUp size={14} className="text-slate-600" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic px-4 leading-relaxed">
                                        Preencha **BU** e **Segmento** para gerar projeções baseadas em dados históricos...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Header de info do match */}
                                    <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${projections.taxaConversao?.method === 'exact' ? 'bg-emerald-500' :
                                                projections.taxaConversao?.method === 'partial' ? 'bg-yellow-500' :
                                                    'bg-orange-500'
                                                }`} />
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                {projections.taxaConversao?.method === 'exact' && '✓ Match Exato (100%)'}
                                                {projections.taxaConversao?.method === 'partial' && '≈ Match Parcial (70%)'}
                                                {projections.taxaConversao?.method === 'fallback' && '~ Fallback (50%)'}
                                            </span>
                                        </div>
                                        <span className="text-[8px] text-slate-500 font-mono">
                                            {projections.taxaConversao?.sampleSize || 0} disparos
                                        </span>
                                    </div>

                                    {/* Grid de Métricas Projetadas */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Taxa Conversão */}
                                        {projections.taxaConversao && (
                                            <div className="bg-black/20 border border-indigo-500/10 rounded-lg p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] text-slate-400">Taxa Conv.</span>
                                                    <span className="text-[8px] text-indigo-400 font-bold">
                                                        {projections.taxaConversao.confidence}%
                                                    </span>
                                                </div>
                                                <div className="text-lg font-bold text-indigo-300">
                                                    {projections.taxaConversao.projectedValue.toFixed(2)}%
                                                </div>
                                                <div className="text-[8px] text-slate-500 mt-0.5">
                                                    {projections.taxaConversao.confidenceInterval.min.toFixed(1)}% - {projections.taxaConversao.confidenceInterval.max.toFixed(1)}%
                                                </div>
                                            </div>
                                        )}

                                        {/* CAC */}
                                        {projections.cac && (
                                            <div className="bg-black/20 border border-indigo-500/10 rounded-lg p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] text-slate-400">CAC</span>
                                                    <span className="text-[8px] text-indigo-400 font-bold">
                                                        {projections.cac.confidence}%
                                                    </span>
                                                </div>
                                                <div className="text-lg font-bold text-indigo-300">
                                                    R$ {projections.cac.projectedValue.toFixed(2)}
                                                </div>
                                                <div className="text-[8px] text-slate-500 mt-0.5">
                                                    R$ {projections.cac.confidenceInterval.min.toFixed(2)} - {projections.cac.confidenceInterval.max.toFixed(2)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cartões */}
                                        {projections.cartoesGerados && (
                                            <div className="bg-black/20 border border-indigo-500/10 rounded-lg p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] text-slate-400">Cartões</span>
                                                    <span className="text-[8px] text-indigo-400 font-bold">
                                                        {projections.cartoesGerados.confidence}%
                                                    </span>
                                                </div>
                                                <div className="text-lg font-bold text-indigo-300">
                                                    {Math.round(projections.cartoesGerados.projectedValue).toLocaleString()}
                                                </div>
                                                <div className="text-[8px] text-slate-500 mt-0.5">
                                                    {Math.round(projections.cartoesGerados.confidenceInterval.min).toLocaleString()} - {Math.round(projections.cartoesGerados.confidenceInterval.max).toLocaleString()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Taxa Entrega */}
                                        {projections.taxaEntrega && (
                                            <div className="bg-black/20 border border-indigo-500/10 rounded-lg p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] text-slate-400">Tx. Entrega</span>
                                                    <span className="text-[8px] text-indigo-400 font-bold">
                                                        {projections.taxaEntrega.confidence}%
                                                    </span>
                                                </div>
                                                <div className="text-base font-bold text-indigo-300">
                                                    {projections.taxaEntrega.projectedValue.toFixed(1)}%
                                                </div>
                                                <div className="text-[8px] text-slate-500 mt-0.5">
                                                    {projections.taxaEntrega.confidenceInterval.min.toFixed(1)}% - {projections.taxaEntrega.confidenceInterval.max.toFixed(1)}%
                                                </div>
                                            </div>
                                        )}

                                        {/* Taxa Abertura */}
                                        {projections.taxaAbertura && (
                                            <div className="bg-black/20 border border-indigo-500/10 rounded-lg p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] text-slate-400">Tx. Abertura</span>
                                                    <span className="text-[8px] text-indigo-400 font-bold">
                                                        {projections.taxaAbertura.confidence}%
                                                    </span>
                                                </div>
                                                <div className="text-base font-bold text-indigo-300">
                                                    {projections.taxaAbertura.projectedValue.toFixed(1)}%
                                                </div>
                                                <div className="text-[8px] text-slate-500 mt-0.5">
                                                    {projections.taxaAbertura.confidenceInterval.min.toFixed(1)}% - {projections.taxaAbertura.confidenceInterval.max.toFixed(1)}%
                                                </div>
                                            </div>
                                        )}

                                        {/* Propostas */}
                                        {projections.propostas && (
                                            <div className="bg-black/20 border border-indigo-500/10 rounded-lg p-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] text-slate-400">Propostas</span>
                                                    <span className="text-[8px] text-indigo-400 font-bold">
                                                        {projections.propostas.confidence}%
                                                    </span>
                                                </div>
                                                <div className="text-base font-bold text-indigo-300">
                                                    {Math.round(projections.propostas.projectedValue).toLocaleString()}
                                                </div>
                                                <div className="text-[8px] text-slate-500 mt-0.5">
                                                    {Math.round(projections.propostas.confidenceInterval.min).toLocaleString()} - {Math.round(projections.propostas.confidenceInterval.max).toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Legenda */}
                                    <div className="text-[8px] text-slate-600 border-t border-indigo-500/10 pt-2">
                                        💡 Projeções baseadas em similaridade (BU+Segmento+Perfil+Canal), decaimento temporal (90d) e ponderação por volume
                                    </div>
                                </>
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
