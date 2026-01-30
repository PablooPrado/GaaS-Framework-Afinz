import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Tag, User, Info, Trash2, TrendingUp, AlertCircle, DollarSign, CheckCircle2, Package, Target, Layers } from 'lucide-react';
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
    editingActivity?: ActivityRow | null;
    activeSegmento: string;
}

/**
 * Modal para criar/editar atividades (GaaS) Unificado
 * Redesign Horizontal (5 Colunas) - "Full Panorama"
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

    const [selectedSegmento, setSelectedSegmento] = useState(activeSegmento);
    const [projections, setProjections] = useState<Record<string, ProjectionResult>>({});

    // --- EFFECT HOOKS (LOGIC) ---
    // 1. Preencher form se editando
    useEffect(() => {
        if (editingActivity) {
            setFormData({
                bu: editingActivity.BU as any,
                jornada: editingActivity.jornada,
                activityName: editingActivity['Activity name / Taxonomia'],
                dataInicio: editingActivity['Data de Disparo'],
                dataFim: editingActivity['Data Fim'],
                horarioDisparo: editingActivity['Horário de Disparo'] || '10:00',
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

    // 2. Auto-fill Data Fim
    useEffect(() => {
        if (formData.dataInicio && !editingActivity) {
            const startDate = new Date(formData.dataInicio);
            startDate.setDate(startDate.getDate() + 2);
            const endDate = startDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dataFim: endDate }));
        }
    }, [formData.dataInicio, editingActivity]);

    // 3. Auto-cálculo Safra
    useEffect(() => {
        if (formData.dataInicio) {
            const safra = generateSafra(formData.dataInicio);
            setFormData(prev => ({ ...prev, safra }));
        }
    }, [formData.dataInicio]);

    // 4. Auto-cálculo Ordem de Disparo
    useEffect(() => {
        if (formData.jornada && formData.dataInicio && !editingActivity) {
            const ordem = calculateOrdemDisparo(formData.jornada, formData.dataInicio, activities);
            setFormData(prev => ({ ...prev, ordemDisparo: ordem }));
        }
    }, [formData.jornada, formData.dataInicio, activities, editingActivity]);

    // 5. Auto-sugestão Activity Name
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

    // 6 & 7. Custos Unitários
    useEffect(() => {
        if (formData.canal && CUSTO_UNITARIO_CANAL[formData.canal]) {
            setFormData(prev => ({ ...prev, custoUnitarioCanal: String(CUSTO_UNITARIO_CANAL[formData.canal].toFixed(3)) }));
        }
    }, [formData.canal]);

    useEffect(() => {
        if (formData.oferta && CUSTO_UNITARIO_OFERTA[formData.oferta]) {
            setFormData(prev => ({ ...prev, custoUnitarioOferta: String(CUSTO_UNITARIO_OFERTA[formData.oferta].toFixed(2)) }));
        }
    }, [formData.oferta]);

    // 8. Custos Totais
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

    // 9. Projeções IA
    useEffect(() => {
        if (formData.bu && selectedSegmento && activities.length > 0) {
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
    }, [formData.bu, selectedSegmento, formData.perfilCredito, formData.canal, formData.baseVolume, activities]);

    // 10. Sugestões Históricas
    useEffect(() => {
        if (!editingActivity && formData.bu && selectedSegmento && formData.jornada && activities.length > 0) {
            try {
                const suggestions = suggestFieldsBasedOnHistory(activities, {
                    bu: formData.bu,
                    segmento: selectedSegmento,
                    jornada: formData.jornada,
                    parceiro: formData.parceiro || undefined
                });
                setFormData(prev => ({
                    ...prev,
                    subgrupo: prev.subgrupo || (suggestions.subgrupo?.[0]?.value ? String(suggestions.subgrupo[0].value) : ''),
                    oferta: prev.oferta || (suggestions.oferta?.[0]?.value ? String(suggestions.oferta[0].value) : ''),
                    promocional: prev.promocional || (suggestions.promocional?.[0]?.value ? String(suggestions.promocional[0].value) : ''),
                    oferta2: prev.oferta2 || (suggestions.oferta2?.[0]?.value ? String(suggestions.oferta2[0].value) : ''),
                    promocional2: prev.promocional2 || (suggestions.promocional2?.[0]?.value ? String(suggestions.promocional2[0].value) : ''),
                    perfilCredito: prev.perfilCredito || (suggestions.perfilCredito?.[0]?.value ? String(suggestions.perfilCredito[0].value) : '')
                }));
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
                parseResult.error.issues.forEach(err => {
                    const field = err.path[0] as string;
                    newErrors[field] = err.message;
                });
                setErrors(newErrors);
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
                        'Horário de Disparo': parseResult.data.horarioDisparo,
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
                savedActivity = await activityService.saveActivity(parseResult.data, selectedSegmento);
            }

            onSuccess(savedActivity);
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar atividade:', error);
            setErrors({ form: `Erro ao salvar: ${error?.message || 'Erro desconhecido'}` });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            {/* Modal Container -- FULL PANORAMA */}
            <div className="relative w-full max-w-[98vw] h-[95vh] flex flex-col bg-[#0f172a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-700/50 ring-1 ring-white/5 mx-2">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#0f172a] border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editingActivity ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                            {editingActivity ? <CheckCircle2 size={20} /> : <Calendar size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                {editingActivity ? 'Editar Disparo' : 'Novo Disparo'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {editingActivity ? 'Edite os parâmetros da atividade' : 'Preencha os dados no panorama completo'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable Horizontal if needed, but mostly fitted */}
                <div id="modal-content" className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-5 scroll-smooth scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">

                    {errors.form && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {errors.form}
                        </div>
                    )}

                    {/* Layout Grid: 1 Col (Mobile) -> 3 Cols (Tablet) -> 5 Cols (Ultrawide) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">

                        {/* BLOCK 1: IDENTIFICAÇÃO */}
                        <div className="min-w-0">
                            <SectionCard title="Identificação" icon={<Tag size={16} />} badge="1">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label label="BU" required />
                                            <Select value={formData.bu} onChange={(e) => handleChange('bu', e.target.value)} error={errors.bu}>
                                                <option value="">...</option>
                                                <option value="B2C">B2C</option>
                                                <option value="B2B2C">B2B2C</option>
                                                <option value="Plurix">Plurix</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label label="Seg." required />
                                            <Select value={selectedSegmento} onChange={(e) => setSelectedSegmento(e.target.value)}>
                                                <option value="">...</option>
                                                {historicalOptions.segmentos.map(s => <option key={s} value={s}>{s}</option>)}
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label label="Nome da Atividade" required />
                                        <Input
                                            value={formData.activityName}
                                            onChange={(e) => handleChange('activityName', e.target.value)}
                                            placeholder="campanha_2026"
                                            className="font-mono text-[10px] bg-slate-950/30 border-slate-800 text-slate-300"
                                            error={errors.activityName}
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-slate-700/50 space-y-3">
                                        <div>
                                            <Label label="Jornada" required />
                                            <Input list="jornadas-list" value={formData.jornada} onChange={(e) => handleChange('jornada', e.target.value)} error={errors.jornada} />
                                            <datalist id="jornadas-list">{historicalOptions.jornadas.map(j => <option key={j} value={j} />)}</datalist>
                                        </div>
                                        <div>
                                            <Label label="Canal" required />
                                            <Select value={formData.canal} onChange={(e) => handleChange('canal', e.target.value)} error={errors.canal}>
                                                <option value="">Selecione</option>
                                                {(historicalOptions.canais.length > 0 ? historicalOptions.canais : CANAIS).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
                                        <div>
                                            <Label label="Parceiro" />
                                            <Input list="parceiros-list" value={formData.parceiro} onChange={(e) => handleChange('parceiro', e.target.value)} placeholder="-" />
                                            <datalist id="parceiros-list">{historicalOptions.parceiros.map(p => <option key={p} value={p} />)}</datalist>
                                        </div>
                                        <div>
                                            <Label label="Subgrupo" />
                                            <Input list="subgrupos-list" value={formData.subgrupo} onChange={(e) => handleChange('subgrupo', e.target.value)} placeholder="-" />
                                            <datalist id="subgrupos-list">{historicalOptions.subgrupos.map(s => <option key={s} value={s} />)}</datalist>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* BLOCK 2: CRONOGRAMA */}
                        <div className="min-w-0">
                            <SectionCard title="Cronograma" icon={<Calendar size={16} />} badge="2">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label label="Data Início" required />
                                            <Input type="date" value={formData.dataInicio} onChange={(e) => handleChange('dataInicio', e.target.value)} />
                                        </div>
                                        <div className="col-span-2">
                                            <Label label="Data Fim" required />
                                            <Input type="date" value={formData.dataFim} onChange={(e) => handleChange('dataFim', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-700/50">
                                        <Label label="Horário" />
                                        <Input type="time" value={formData.horarioDisparo} onChange={(e) => handleChange('horarioDisparo', e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                                            <Label label="Safra" />
                                            <div className="text-xs text-slate-300 font-mono text-center">{formData.safra || '-'}</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                                            <Label label="Ordem" />
                                            <div className="text-xs text-slate-300 font-mono text-center">{formData.ordemDisparo || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* BLOCK 3: PRODUTO */}
                        <div className="min-w-0">
                            <SectionCard title="Produto & Oferta" icon={<Package size={16} />} badge="3">
                                <div className="space-y-4">
                                    <div>
                                        <Label label="Produto" required />
                                        <Select value={formData.produto} onChange={(e) => handleChange('produto', e.target.value)}>
                                            <option value="">Selecione</option>
                                            {(historicalOptions.produtos.length > 0 ? historicalOptions.produtos : PRODUTOS).map(p => <option key={p} value={p}>{p}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label label="Perfil Crédito" />
                                        <Select value={formData.perfilCredito} onChange={(e) => handleChange('perfilCredito', e.target.value)}>
                                            <option value="">Selecione</option>
                                            {historicalOptions.perfisCredito.map(p => <option key={p} value={p}>{p}</option>)}
                                        </Select>
                                    </div>

                                    <div className="pt-2 border-t border-slate-700/50">
                                        <Label label="Oferta Principal" required />
                                        <Input list="ofertas-list" value={formData.oferta} onChange={(e) => handleChange('oferta', e.target.value)} />
                                        <datalist id="ofertas-list">{historicalOptions.ofertas.map(o => <option key={o} value={o} />)}</datalist>
                                    </div>
                                    <div>
                                        <Label label="Promocional" />
                                        <Input list="promocionais-list" value={formData.promocional} onChange={(e) => handleChange('promocional', e.target.value)} />
                                        <datalist id="promocionais-list">{historicalOptions.promocionais.map(p => <option key={p} value={p} />)}</datalist>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* BLOCK 4: INVESTIMENTO */}
                        <div className="min-w-0">
                            <SectionCard title="Investimento" icon={<DollarSign size={16} />} headerClassName="text-emerald-400 border-emerald-500/20" badge="4">
                                <div className="space-y-4">
                                    <div>
                                        <Label label="Volume da Base" />
                                        <Input
                                            type="number"
                                            value={formData.baseVolume}
                                            onChange={(e) => handleChange('baseVolume', e.target.value)}
                                            placeholder="Ex: 50000"
                                            className="text-lg font-medium text-emerald-400 border-emerald-500/30 bg-emerald-950/20"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label label="Custo U. Oferta" />
                                            <Input type="number" step="0.01" value={formData.custoUnitarioOferta} onChange={(e) => handleChange('custoUnitarioOferta', e.target.value)} className="bg-slate-900/50" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <Label label="Custo U. Canal" />
                                            <Input type="number" step="0.001" value={formData.custoUnitarioCanal} onChange={(e) => handleChange('custoUnitarioCanal', e.target.value)} className="bg-slate-900/50" placeholder="0.000" />
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6">
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                                            <span className="text-[10px] uppercase text-emerald-500 font-bold block mb-1">Total Campanha</span>
                                            <span className="text-lg font-bold text-emerald-300 block">
                                                R$ {Number(formData.custoTotalCampanha).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* BLOCK 5: PROJEÇÃO IA */}
                        <div className="min-w-0">
                            <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20 shadow-sm flex flex-col h-full hover:border-indigo-500/40 transition-colors">
                                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20 mb-4">
                                    <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wide">
                                        <TrendingUp size={16} />
                                        Projeção IA
                                    </h3>
                                    <span className="px-1.5 py-0.5 bg-indigo-500/10 rounded text-[9px] text-indigo-400 font-bold">5</span>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <MetricCard label="Taxa Conv." value={projections.taxaConversao?.projectedValue} suffix="%" confidence={projections.taxaConversao?.confidence} />
                                    <MetricCard label="CAC Previsto" value={projections.cac?.projectedValue} prefix="R$ " confidence={projections.cac?.confidence} />
                                    <MetricCard label="Cartões Estimados" value={projections.cartoesGerados?.projectedValue} isInt confidence={projections.cartoesGerados?.confidence} />
                                </div>
                                <div className="mt-4 text-[9px] text-indigo-400/50 leading-tight text-center border-t border-indigo-500/10 pt-2">
                                    Baseado em {projections.taxaConversao?.sampleSize || 0} disparos.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#0f172a] border-t border-slate-800 flex justify-between items-center shrink-0 shadow-lg z-10">
                    <div>
                        {editingActivity && (
                            <button
                                onClick={handleDelete}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                <span className="hidden md:inline">Excluir</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-400 hover:text-white font-medium text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleSubmit('Rascunho')}
                            disabled={loading}
                            className="px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                        >
                            {loading ? '...' : 'Salvar Rascunho'}
                        </button>
                        <button
                            onClick={() => handleSubmit('Scheduled')}
                            disabled={loading}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} />
                            {loading ? 'Processando...' : 'Agendar Disparo'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- Helper Components ---

const Label = ({ label, required, tooltip }: { label: string, required?: boolean, tooltip?: string }) => (
    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}
        {required && <span className="text-blue-500">*</span>}
        {tooltip && <span title={tooltip} className="text-slate-600 hover:text-slate-400 cursor-help transition-colors"><Info size={11} /></span>}
    </label>
);

const Input = ({ className = "", error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
    <div className="relative">
        <input
            className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} ${className}`}
            {...props}
        />
        {error && <span className="absolute -bottom-4 left-0 text-[9px] text-red-400 font-medium animate-pulse">{error}</span>}
    </div>
);

const Select = ({ className = "", error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) => (
    <div className="relative">
        <select
            className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} ${className}`}
            {...props}
        >
            {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
        </div>
        {error && <span className="absolute -bottom-4 left-0 text-[10px] text-red-400 font-medium">{error}</span>}
    </div>
);

const SectionCard = ({ title, icon, children, headerClassName = "text-slate-300", badge }: { title: string, icon: React.ReactNode, children: React.ReactNode, headerClassName?: string, badge?: string }) => (
    <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-3 hover:border-slate-600/50 transition-colors duration-300 h-full">
        <div className={`flex items-center justify-between pb-2 border-b border-slate-700/50 ${headerClassName}`}>
            <div className="flex items-center gap-2">
                <div className="opacity-70 text-slate-400">{icon}</div>
                <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
            </div>
            {badge && <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[9px] text-slate-400 font-bold uppercase">{badge}</span>}
        </div>
        <div className="space-y-3 flex-1 flex flex-col">
            {children}
        </div>
    </section>
);

const MetricCard = ({ label, value, prefix = "", suffix = "", isInt = false, confidence }: { label: string, value?: number, prefix?: string, suffix?: string, isInt?: boolean, confidence?: number }) => (
    <div className="bg-slate-900/50 border border-indigo-500/10 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-[9px] uppercase font-bold text-indigo-400 mb-0.5">{label}</span>
        <div className="text-base font-bold text-indigo-200">
            {value !== undefined ? (
                <>
                    <span className="text-[10px] text-indigo-500 mr-0.5">{prefix}</span>
                    {isInt ? Math.round(value).toLocaleString() : value.toFixed(2)}
                    <span className="text-[10px] text-indigo-500 ml-0.5">{suffix}</span>
                </>
            ) : '-'}
        </div>
    </div>
);
