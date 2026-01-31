import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ActivityRow, ActivityStatus } from '../../../types/activity';
import { useAppStore } from '../../../store/useAppStore';
import {
    CUSTO_UNITARIO_CANAL,
    CUSTO_UNITARIO_OFERTA,
    generateSafra,
    calculateOrdemDisparo,
    suggestActivityName,
    calcularCustoTotalOferta,
    calcularCustoTotalCanal,
    calcularCustoTotalCampanha,
} from '../../../constants/frameworkFields';
import {
    calculateProjections,
    ProjectionResult,
    suggestFieldsBasedOnHistory
} from '../../../utils/intelligentSuggestions';
import type { Canal } from '../../../constants/frameworkFields';

/**
 * Form Input - Todos os campos do formulario de disparo
 */
export interface DispatchFormData {
    // Identificacao
    bu: 'B2C' | 'B2B2C' | 'Plurix' | '';
    segmento: string;
    jornada: string;
    activityName: string;
    canal: Canal | '';
    parceiro: string;
    subgrupo: string;

    // Cronograma
    dataInicio: string;
    dataFim: string;
    horarioDisparo: string;
    safra: string;
    ordemDisparo: number;

    // Produto & Oferta
    produto: string;
    perfilCredito: string;
    etapaAquisicao: string;
    oferta: string;
    promocional: string;
    oferta2: string;
    promocional2: string;

    // Investimento
    baseVolume: string;
    custoUnitarioOferta: string;
    custoTotalOferta: string;
    custoUnitarioCanal: string;
    custoTotalCanal: string;
    custoTotalCampanha: string;

    // Status
    status: ActivityStatus;
}

/**
 * Opcoes historicas extraidas do banco
 */
export interface HistoricalOptions {
    segmentos: string[];
    perfisCredito: string[];
    ofertas: string[];
    ofertas2: string[];
    promocionais: string[];
    promocionais2: string[];
    jornadas: string[];
    parceiros: string[];
    subgrupos: string[];
    etapasAquisicao: string[];
    produtos: string[];
    canais: string[];
}

/**
 * Interface do Context
 */
interface DispatchFormContextValue {
    // Estado do form
    formData: DispatchFormData;
    setFormData: React.Dispatch<React.SetStateAction<DispatchFormData>>;
    handleChange: (field: keyof DispatchFormData, value: string | number) => void;

    // Erros de validacao
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

    // Opcoes historicas
    historicalOptions: HistoricalOptions;

    // Projecoes IA
    projections: Record<string, ProjectionResult>;

    // Estado de loading
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

    // Activity sendo editada
    editingActivity: ActivityRow | null;

    // Activities (historico)
    activities: ActivityRow[];
}

const DispatchFormContext = createContext<DispatchFormContextValue | null>(null);

/**
 * Hook para usar o context
 */
export const useDispatchForm = () => {
    const context = useContext(DispatchFormContext);
    if (!context) {
        throw new Error('useDispatchForm deve ser usado dentro de DispatchFormProvider');
    }
    return context;
};

/**
 * Props do Provider
 */
interface DispatchFormProviderProps {
    children: React.ReactNode;
    editingActivity?: ActivityRow | null;
    activeSegmento: string;
}

/**
 * Valor inicial do form
 */
const INITIAL_FORM_DATA: DispatchFormData = {
    bu: '',
    segmento: '',
    jornada: '',
    activityName: '',
    canal: '',
    parceiro: '',
    subgrupo: '',
    dataInicio: '',
    dataFim: '',
    horarioDisparo: '10:00',
    safra: '',
    ordemDisparo: 1,
    produto: 'Classic',
    perfilCredito: '',
    etapaAquisicao: '',
    oferta: '',
    promocional: '',
    oferta2: '',
    promocional2: '',
    baseVolume: '',
    custoUnitarioOferta: '',
    custoTotalOferta: '',
    custoUnitarioCanal: '',
    custoTotalCanal: '',
    custoTotalCampanha: '',
    status: 'Rascunho',
};

/**
 * Provider do context
 */
export const DispatchFormProvider: React.FC<DispatchFormProviderProps> = ({
    children,
    editingActivity = null,
    activeSegmento,
}) => {
    const [formData, setFormData] = useState<DispatchFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [projections, setProjections] = useState<Record<string, ProjectionResult>>({});

    // Buscar activities do store
    const activities = useAppStore((state) => state.activities) as ActivityRow[];

    // Extrair opcoes historicas
    const historicalOptions = useMemo<HistoricalOptions>(() => {
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

        activities.forEach((activity: any) => {
            if (activity.Segmento) segmentos.add(activity.Segmento);
            if (activity.jornada) jornadas.add(activity.jornada);
            if (activity.Oferta) ofertas.add(activity.Oferta);
            if (activity.Canal) canais.add(activity.Canal);
            if (activity.Promocional) promocionais.add(activity.Promocional);
            if (activity['Oferta 2']) ofertas2.add(activity['Oferta 2']);
            if (activity['Promocional 2']) promocionais2.add(activity['Promocional 2']);
            if (activity['Perfil de Crédito']) perfisCredito.add(activity['Perfil de Crédito']);
            if (activity.Parceiro) parceiros.add(activity.Parceiro);
            if (activity.Subgrupos) subgrupos.add(activity.Subgrupos);
            if (activity['Etapa de aquisição']) etapasAquisicao.add(activity['Etapa de aquisição']);
            if (activity.Produto) produtos.add(activity.Produto);
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

    // Handler para mudanca de campo
    const handleChange = useCallback((field: keyof DispatchFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    // Effect 1: Preencher form se editando
    useEffect(() => {
        if (editingActivity) {
            setFormData({
                bu: editingActivity.BU as any,
                segmento: editingActivity.Segmento,
                jornada: editingActivity.jornada,
                activityName: editingActivity['Activity name / Taxonomia'],
                canal: (editingActivity.Canal || '') as Canal,
                parceiro: editingActivity.Parceiro || '',
                subgrupo: editingActivity.Subgrupos || '',
                dataInicio: editingActivity['Data de Disparo'],
                dataFim: editingActivity['Data Fim'],
                horarioDisparo: editingActivity['Horário de Disparo'] || '10:00',
                safra: editingActivity.Safra || '',
                ordemDisparo: editingActivity['Ordem de disparo'] || 1,
                produto: editingActivity.Produto || 'Classic',
                perfilCredito: editingActivity['Perfil de Crédito'] || '',
                etapaAquisicao: editingActivity['Etapa de aquisição'] || '',
                oferta: editingActivity.Oferta || '',
                promocional: editingActivity.Promocional || '',
                oferta2: editingActivity['Oferta 2'] || '',
                promocional2: editingActivity['Promocional 2'] || '',
                baseVolume: String(editingActivity['Base Total'] || ''),
                custoUnitarioOferta: '',
                custoTotalOferta: '',
                custoUnitarioCanal: '',
                custoTotalCanal: '',
                custoTotalCampanha: '',
                status: editingActivity.status,
            });
        } else {
            setFormData({
                ...INITIAL_FORM_DATA,
                segmento: activeSegmento,
            });
            setErrors({});
        }
    }, [editingActivity, activeSegmento]);

    // Effect 2: Auto-fill Data Fim
    useEffect(() => {
        if (formData.dataInicio && !editingActivity) {
            const startDate = new Date(formData.dataInicio);
            startDate.setDate(startDate.getDate() + 2);
            const endDate = startDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dataFim: endDate }));
        }
    }, [formData.dataInicio, editingActivity]);

    // Effect 3: Auto-calculo Safra
    useEffect(() => {
        if (formData.dataInicio) {
            const safra = generateSafra(formData.dataInicio);
            setFormData(prev => ({ ...prev, safra }));
        }
    }, [formData.dataInicio]);

    // Effect 4: Auto-calculo Ordem de Disparo
    useEffect(() => {
        if (formData.jornada && formData.dataInicio && !editingActivity) {
            const ordem = calculateOrdemDisparo(formData.jornada, formData.dataInicio, activities);
            setFormData(prev => ({ ...prev, ordemDisparo: ordem }));
        }
    }, [formData.jornada, formData.dataInicio, activities, editingActivity]);

    // Effect 5: Auto-sugestao Activity Name
    useEffect(() => {
        if (formData.bu && formData.segmento && formData.jornada && formData.safra && formData.ordemDisparo && !editingActivity) {
            const suggestedName = suggestActivityName(
                formData.bu,
                formData.segmento,
                formData.jornada,
                formData.ordemDisparo || 1,
                formData.safra
            );
            if (suggestedName && !formData.activityName) {
                setFormData(prev => ({ ...prev, activityName: suggestedName }));
            }
        }
    }, [formData.bu, formData.segmento, formData.jornada, formData.safra, formData.ordemDisparo, editingActivity, formData.activityName]);

    // Effect 6: Custo Unitario Canal
    useEffect(() => {
        if (formData.canal && CUSTO_UNITARIO_CANAL[formData.canal as Canal]) {
            setFormData(prev => ({
                ...prev,
                custoUnitarioCanal: String(CUSTO_UNITARIO_CANAL[formData.canal as Canal].toFixed(3))
            }));
        }
    }, [formData.canal]);

    // Effect 7: Custo Unitario Oferta
    useEffect(() => {
        if (formData.oferta && CUSTO_UNITARIO_OFERTA[formData.oferta]) {
            setFormData(prev => ({
                ...prev,
                custoUnitarioOferta: String(CUSTO_UNITARIO_OFERTA[formData.oferta].toFixed(2))
            }));
        }
    }, [formData.oferta]);

    // Effect 8: Custos Totais
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

    // Effect 9: Projecoes IA
    useEffect(() => {
        if (formData.bu && formData.segmento && activities.length > 0) {
            try {
                const projectionInput = {
                    bu: formData.bu,
                    segmento: formData.segmento,
                    perfilCredito: formData.perfilCredito || undefined,
                    canal: formData.canal || undefined,
                    baseVolume: Number(formData.baseVolume) || undefined
                };
                const results = calculateProjections(activities as any, projectionInput);
                setProjections(results);
            } catch (error) {
                console.error('Erro ao calcular projecoes:', error);
                setProjections({});
            }
        } else {
            setProjections({});
        }
    }, [formData.bu, formData.segmento, formData.perfilCredito, formData.canal, formData.baseVolume, activities]);

    // Effect 10: Sugestoes Historicas
    useEffect(() => {
        if (!editingActivity && formData.bu && formData.segmento && formData.jornada && activities.length > 0) {
            try {
                const suggestions = suggestFieldsBasedOnHistory(activities as any, {
                    bu: formData.bu,
                    segmento: formData.segmento,
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
                console.error('Erro ao gerar sugestoes:', error);
            }
        }
    }, [formData.bu, formData.segmento, formData.jornada, formData.parceiro, activities, editingActivity]);

    const value = useMemo<DispatchFormContextValue>(() => ({
        formData,
        setFormData,
        handleChange,
        errors,
        setErrors,
        historicalOptions,
        projections,
        loading,
        setLoading,
        editingActivity,
        activities,
    }), [formData, handleChange, errors, historicalOptions, projections, loading, editingActivity, activities]);

    return (
        <DispatchFormContext.Provider value={value}>
            {children}
        </DispatchFormContext.Provider>
    );
};

export default DispatchFormContext;
