import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Tag, User } from 'lucide-react';
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

    const historicalOptions = useMemo(() => {
        const segmentos = new Set<string>();
        const perfisCredito = new Set<string>();
        const ofertas = new Set<string>();
        const ofertas2 = new Set<string>();
        const promocionais = new Set<string>();
        const promocionais2 = new Set<string>();
        const jornadas = new Set<string>();

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
                const issues = parseResult.error.errors || [];
                issues.forEach(err => {
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

                <div id="modal-content" className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-700">
                            <User className="w-4 h-4" /> Identificação
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">BU *</label>
                                <select
                                    value={formData.bu}
                                    onChange={(e) => handleChange('bu', e.target.value)}
                                    className={`w-full px-2 py-1.5 bg-slate-700 border rounded text-sm text-white focus:ring-1 focus:ring-blue-500 ${errors.bu ? 'border-red-500' : 'border-slate-600'}`}
                                >
                                    <option value="">Selecione</option>
                                    <option value="B2C">B2C</option>
                                    <option value="B2B2C">B2B2C</option>
                                    <option value="Plurix">Plurix</option>
                                </select>
                                {errors.bu && <span className="text-red-400 text-xs">{errors.bu}</span>}
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Segmento *</label>
                                <select
                                    value={selectedSegmento}
                                    onChange={(e) => setSelectedSegmento(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                >
                                    <option value="">Selecione</option>
                                    {historicalOptions.segmentos.map(seg => (
                                        <option key={seg} value={seg}>{seg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Jornada *</label>
                            <input
                                list="jornadas-list"
                                value={formData.jornada}
                                onChange={(e) => handleChange('jornada', e.target.value)}
                                className={`w-full px-2 py-1.5 bg-slate-700 border rounded text-sm text-white ${errors.jornada ? 'border-red-500' : 'border-slate-600'}`}
                                placeholder="Selecione ou digite..."
                            />
                            <datalist id="jornadas-list">
                                {historicalOptions.jornadas.map(j => <option key={j} value={j} />)}
                            </datalist>
                            {errors.jornada && <span className="text-red-400 text-xs">{errors.jornada}</span>}
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Activity Name *</label>
                            <input
                                type="text"
                                value={formData.activityName}
                                onChange={(e) => handleChange('activityName', e.target.value)}
                                placeholder="campanha_reativacao_janeiro_2026"
                                className={`w-full px-2 py-1.5 bg-slate-700 border rounded text-sm text-white font-mono ${errors.activityName ? 'border-red-500' : 'border-slate-600'}`}
                            />
                            {errors.activityName && <span className="text-red-400 text-xs">{errors.activityName}</span>}
                        </div>

                        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 pt-2 pb-2 border-b border-slate-700">
                            <Calendar className="w-4 h-4" /> Período
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Início *</label>
                                <input
                                    type="date"
                                    value={formData.dataInicio}
                                    onChange={(e) => handleChange('dataInicio', e.target.value)}
                                    className={`w-full px-2 py-1.5 bg-slate-700 border rounded text-sm text-white ${errors.dataInicio ? 'border-red-500' : 'border-slate-600'}`}
                                />
                                {errors.dataInicio && <span className="text-red-400 text-xs">{errors.dataInicio}</span>}
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Fim *</label>
                                <input
                                    type="date"
                                    value={formData.dataFim}
                                    onChange={(e) => handleChange('dataFim', e.target.value)}
                                    min={formData.dataInicio}
                                    className={`w-full px-2 py-1.5 bg-slate-700 border rounded text-sm text-white ${errors.dataFim ? 'border-red-500' : 'border-slate-600'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Horário</label>
                                <input
                                    type="time"
                                    value={formData.horarioDisparo}
                                    onChange={(e) => handleChange('horarioDisparo', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-700">
                            <Tag className="w-4 h-4" /> Ofertas & Crédito
                        </h3>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Perfil de Crédito</label>
                            <select
                                value={formData.perfilCredito}
                                onChange={(e) => handleChange('perfilCredito', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                            >
                                <option value="">Selecione</option>
                                {historicalOptions.perfisCredito.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Oferta *</label>
                                <input
                                    list="ofertas-list"
                                    value={formData.oferta}
                                    onChange={(e) => handleChange('oferta', e.target.value)}
                                    className={`w-full px-2 py-1.5 bg-slate-700 border rounded text-sm text-white ${errors.oferta ? 'border-red-500' : 'border-slate-600'}`}
                                    placeholder="Selecione..."
                                />
                                <datalist id="ofertas-list">
                                    {historicalOptions.ofertas.map(o => <option key={o} value={o} />)}
                                </datalist>
                                {errors.oferta && <span className="text-red-400 text-xs">{errors.oferta}</span>}
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Promocional</label>
                                <input
                                    list="promocionais-list"
                                    value={formData.promocional}
                                    onChange={(e) => handleChange('promocional', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                    placeholder="Selecione..."
                                />
                                <datalist id="promocionais-list">
                                    {historicalOptions.promocionais.map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Oferta 2</label>
                                <input
                                    list="ofertas2-list"
                                    value={formData.oferta2}
                                    onChange={(e) => handleChange('oferta2', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                />
                                <datalist id="ofertas2-list">
                                    {historicalOptions.ofertas2.map(o => <option key={o} value={o} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Promocional 2</label>
                                <input
                                    list="promocionais2-list"
                                    value={formData.promocional2}
                                    onChange={(e) => handleChange('promocional2', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                />
                                <datalist id="promocionais2-list">
                                    {historicalOptions.promocionais2.map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
                    {errors.form && (
                        <span className="text-red-400 text-xs mr-auto font-medium bg-red-900/20 px-2 py-1 rounded">
                            {errors.form}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('Rascunho')}
                        disabled={loading}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                        {loading ? 'Salvando...' : 'Salvar Rascunho'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('Scheduled')}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                        {loading ? 'Agendando...' : 'Agendar & Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
