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
 * Redesign Minimalista "Warm Gray"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl h-[95vh] md:h-[90vh] flex flex-col bg-[#FAFAF9] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-stone-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                            {editingActivity ? <CheckCircle2 className="text-amber-500" size={20} /> : <Calendar className="text-amber-500" size={20} />}
                            {editingActivity ? 'Editar Disparo' : 'Novo Disparo'}
                        </h2>
                        <p className="text-xs text-stone-500 mt-1 ml-7">
                            {editingActivity ? 'Atualize as informações do disparo' : 'Preencha os dados abaixo para programar'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div id="modal-content" className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">

                    {errors.form && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {errors.form}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* LEFT COLUMN: IDENTIFICATION & SCHEDULE */}
                        <div className="space-y-6">

                            {/* Card 1: Informações Principais */}
                            <SectionCard title="Identificação" icon={<Tag size={16} />}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <Label label="BU" required tooltip="Unidade de Negócio" />
                                        <Select value={formData.bu} onChange={(e) => handleChange('bu', e.target.value)} error={errors.bu}>
                                            <option value="">Selecione</option>
                                            <option value="B2C">B2C</option>
                                            <option value="B2B2C">B2B2C</option>
                                            <option value="Plurix">Plurix</option>
                                        </Select>
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Segmento" required tooltip="Público alvo" />
                                        <Select value={selectedSegmento} onChange={(e) => setSelectedSegmento(e.target.value)}>
                                            <option value="">Selecione</option>
                                            {historicalOptions.segmentos.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Select>
                                    </div>

                                    {/* Activity Name - Full Width */}
                                    <div className="col-span-2">
                                        <Label label="Nome da Atividade" required tooltip="Taxonomia única" />
                                        <Input
                                            value={formData.activityName}
                                            onChange={(e) => handleChange('activityName', e.target.value)}
                                            placeholder="campanha_exemplo_2026"
                                            className="font-mono text-xs bg-stone-50"
                                            error={errors.activityName}
                                        />
                                    </div>

                                    {/* Parceiro & Subgrupo */}
                                    <div className="col-span-1">
                                        <Label label="Parceiro" tooltip="Ex: Afinz, Pluxee" />
                                        <Input
                                            list="parceiros-list"
                                            value={formData.parceiro}
                                            onChange={(e) => handleChange('parceiro', e.target.value)}
                                            placeholder="Opcional"
                                        />
                                        <datalist id="parceiros-list">
                                            {historicalOptions.parceiros.map(p => <option key={p} value={p} />)}
                                        </datalist>
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Subgrupo" tooltip="Segmentação fina" />
                                        <Input
                                            list="subgrupos-list"
                                            value={formData.subgrupo}
                                            onChange={(e) => handleChange('subgrupo', e.target.value)}
                                            placeholder="Opcional"
                                        />
                                        <datalist id="subgrupos-list">
                                            {historicalOptions.subgrupos.map(s => <option key={s} value={s} />)}
                                        </datalist>
                                    </div>

                                    {/* Jornada & Canal */}
                                    <div className="col-span-1">
                                        <Label label="Jornada" required />
                                        <Input
                                            list="jornadas-list"
                                            value={formData.jornada}
                                            onChange={(e) => handleChange('jornada', e.target.value)}
                                            error={errors.jornada}
                                        />
                                        <datalist id="jornadas-list">
                                            {historicalOptions.jornadas.map(j => <option key={j} value={j} />)}
                                        </datalist>
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Canal" required />
                                        <Select value={formData.canal} onChange={(e) => handleChange('canal', e.target.value)} error={errors.canal}>
                                            <option value="">Selecione</option>
                                            {(historicalOptions.canais.length > 0 ? historicalOptions.canais : CANAIS).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Card 2: Timeline */}
                            <SectionCard title="Cronograma" icon={<Calendar size={16} />}>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <Label label="Data Início" required />
                                        <Input type="date" value={formData.dataInicio} onChange={(e) => handleChange('dataInicio', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Data Fim" required />
                                        <Input type="date" value={formData.dataFim} onChange={(e) => handleChange('dataFim', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Horário" />
                                        <Input type="time" value={formData.horarioDisparo} onChange={(e) => handleChange('horarioDisparo', e.target.value)} />
                                    </div>

                                    {/* Readonly Fields */}
                                    <div className="col-span-1">
                                        <Label label="Safra (Auto)" />
                                        <div className="px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-lg text-sm text-stone-500 font-medium">
                                            {formData.safra || '-'}
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Ordem (Auto)" />
                                        <div className="px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-lg text-sm text-stone-500 font-medium">
                                            {formData.ordemDisparo || '-'}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* RIGHT COLUMN: CONFIG, OFFERS, INVESTMENT */}
                        <div className="space-y-6">

                            {/* Card 3: Configuração do Produto */}
                            <SectionCard title="Produto & Oferta" icon={<Package size={16} />}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <Label label="Produto" required />
                                        <Select value={formData.produto} onChange={(e) => handleChange('produto', e.target.value)}>
                                            <option value="">Selecione</option>
                                            {(historicalOptions.produtos.length > 0 ? historicalOptions.produtos : PRODUTOS).map(p => <option key={p} value={p}>{p}</option>)}
                                        </Select>
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Perfil Crédito" />
                                        <Select value={formData.perfilCredito} onChange={(e) => handleChange('perfilCredito', e.target.value)}>
                                            <option value="">Selecione</option>
                                            {historicalOptions.perfisCredito.map(p => <option key={p} value={p}>{p}</option>)}
                                        </Select>
                                    </div>

                                    <div className="col-span-1">
                                        <Label label="Oferta Principal" required />
                                        <Input list="ofertas-list" value={formData.oferta} onChange={(e) => handleChange('oferta', e.target.value)} />
                                        <datalist id="ofertas-list">{historicalOptions.ofertas.map(o => <option key={o} value={o} />)}</datalist>
                                    </div>
                                    <div className="col-span-1">
                                        <Label label="Promocional" />
                                        <Input list="promocionais-list" value={formData.promocional} onChange={(e) => handleChange('promocional', e.target.value)} />
                                        <datalist id="promocionais-list">{historicalOptions.promocionais.map(p => <option key={p} value={p} />)}</datalist>
                                    </div>

                                    {/* Secondary Offers (Collapsed look but actually visible for simplicity, or we can use small gap) */}
                                    <div className="col-span-2 pt-2 border-t border-stone-100 grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <Label label="Oferta Secundária" tooltip="Teste A/B" />
                                            <Input list="ofertas2-list" value={formData.oferta2} onChange={(e) => handleChange('oferta2', e.target.value)} placeholder="Opcional" className="bg-stone-50" />
                                            <datalist id="ofertas2-list">{historicalOptions.ofertas2.map(o => <option key={o} value={o} />)}</datalist>
                                        </div>
                                        <div className="col-span-1">
                                            <Label label="Promo Secundário" />
                                            <Input list="promocionais2-list" value={formData.promocional2} onChange={(e) => handleChange('promocional2', e.target.value)} placeholder="Opcional" className="bg-stone-50" />
                                            <datalist id="promocionais2-list">{historicalOptions.promocionais2.map(p => <option key={p} value={p} />)}</datalist>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Card 4: Investimento */}
                            <SectionCard title="Investimento & Volume" icon={<DollarSign size={16} />} headerClassName="text-emerald-700 bg-emerald-50/50">

                                <div className="mb-4">
                                    <Label label="Volume da Base" tooltip="Quantidade de clientes" />
                                    <Input
                                        type="number"
                                        value={formData.baseVolume}
                                        onChange={(e) => handleChange('baseVolume', e.target.value)}
                                        placeholder="Ex: 50000"
                                        className="text-lg font-medium text-emerald-900 border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3 bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
                                    <div>
                                        <Label label="Custo U. Oferta" />
                                        <Input type="number" step="0.01" value={formData.custoUnitarioOferta} onChange={(e) => handleChange('custoUnitarioOferta', e.target.value)} className="text-xs h-8" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <Label label="Custo U. Canal" />
                                        <Input type="number" step="0.001" value={formData.custoUnitarioCanal} onChange={(e) => handleChange('custoUnitarioCanal', e.target.value)} className="text-xs h-8" placeholder="0.000" />
                                    </div>
                                    <div>
                                        <Label label="Total Campanha" />
                                        <div className="h-8 flex items-center px-2 bg-emerald-100/50 border border-emerald-200 rounded text-xs font-bold text-emerald-800">
                                            R$ {Number(formData.custoTotalCampanha).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Card 5: AI Projections */}
                            <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100 shadow-sm">
                                <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-4 uppercase tracking-wide">
                                    <TrendingUp size={16} />
                                    Projeção IA
                                </h3>

                                <div className="grid grid-cols-3 gap-3">
                                    <MetricCard label="Taxa Conv." value={projections.taxaConversao?.projectedValue} suffix="%" confidence={projections.taxaConversao?.confidence} />
                                    <MetricCard label="CAC" value={projections.cac?.projectedValue} prefix="R$ " confidence={projections.cac?.confidence} />
                                    <MetricCard label="Cartões" value={projections.cartoesGerados?.projectedValue} isInt confidence={projections.cartoesGerados?.confidence} />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-stone-200 flex justify-between items-center shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                    <div>
                        {editingActivity && (
                            <button
                                onClick={handleDelete}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                <span className="hidden md:inline">Excluir Disparo</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-stone-500 hover:text-stone-800 font-medium text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleSubmit('Rascunho')}
                            disabled={loading}
                            className="px-5 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                        >
                            {loading ? '...' : 'Salvar Rascunho'}
                        </button>
                        <button
                            onClick={() => handleSubmit('Scheduled')}
                            disabled={loading}
                            className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
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
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-amber-500">*</span>}
        {tooltip && <span title={tooltip} className="text-stone-300 hover:text-stone-500 cursor-help transition-colors"><Info size={12} /></span>}
    </label>
);

const Input = ({ className = "", error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
    <div className="relative">
        <input
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all ${error ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10' : 'border-stone-200 focus:border-amber-500'} ${className}`}
            {...props}
        />
        {error && <span className="absolute -bottom-4 left-0 text-[10px] text-red-500 font-medium animate-pulse">{error}</span>}
    </div>
);

const Select = ({ className = "", error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) => (
    <div className="relative">
        <select
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer ${error ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-amber-500'} ${className}`}
            {...props}
        >
            {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
        </div>
        {error && <span className="absolute -bottom-4 left-0 text-[10px] text-red-500 font-medium">{error}</span>}
    </div>
);

const SectionCard = ({ title, icon, children, headerClassName = "text-stone-800" }: { title: string, icon: React.ReactNode, children: React.ReactNode, headerClassName?: string }) => (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-5 hover:shadow-md transition-shadow duration-300">
        <div className={`flex items-center gap-2 pb-3 border-b border-stone-100 ${headerClassName}`}>
            <div className="opacity-70">{icon}</div>
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </section>
);

const MetricCard = ({ label, value, prefix = "", suffix = "", isInt = false, confidence }: { label: string, value?: number, prefix?: string, suffix?: string, isInt?: boolean, confidence?: number }) => (
    <div className="bg-white border border-indigo-100 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase font-bold text-indigo-300 mb-1">{label}</span>
        <div className="text-lg font-bold text-indigo-900">
            {value !== undefined ? (
                <>
                    <span className="text-xs text-indigo-400 mr-0.5">{prefix}</span>
                    {isInt ? Math.round(value).toLocaleString() : value.toFixed(2)}
                    <span className="text-xs text-indigo-400 ml-0.5">{suffix}</span>
                </>
            ) : '-'}
        </div>
        {confidence && (
            <div className="mt-1 px-1.5 py-0.5 bg-indigo-50 rounded text-[9px] font-bold text-indigo-500">
                {confidence}% conf.
            </div>
        )}
    </div>
);
