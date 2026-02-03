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
    BU_SEGMENTO_MAP,
    SEGMENTO_CONTEXT_MAP,
    OFERTA_DETALHE_MAP
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
    bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Bem Barato' | '';
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
    ordemDisparo: number | string;

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
 * Opcao com frequencia para Combobox
 */
export interface OptionWithFrequency {
    value: string;
    count: number;
    isSmart?: boolean; // Se veio do Framework
}

/**
 * Opcoes historicas extraidas do banco COM FREQUENCIA
 * PILAR: Automatizacao por Historico - ordenado por uso
 */
export interface HistoricalOptions {
    segmentos: OptionWithFrequency[];
    perfisCredito: OptionWithFrequency[];
    ofertas: OptionWithFrequency[];
    ofertas2: OptionWithFrequency[];
    promocionais: OptionWithFrequency[];
    promocionais2: OptionWithFrequency[];
    jornadas: OptionWithFrequency[];
    parceiros: OptionWithFrequency[];
    subgrupos: OptionWithFrequency[];
    etapasAquisicao: OptionWithFrequency[];
    produtos: OptionWithFrequency[];
    canais: OptionWithFrequency[];
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

    // Opcoes INTELIGENTES (Framework + Historico)
    smartOptions: HistoricalOptions;

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

    // Buscar activities e framework data do store
    const activities = useAppStore((state) => state.activities) as ActivityRow[];
    const frameworkData = useAppStore((state) => state.frameworkData) || [];

    // 1. Extrair Opcoes HISTORICAS
    const historicalOptions = useMemo<HistoricalOptions>(() => {
        // Maps para contar frequencia de cada valor
        const segmentosMap = new Map<string, number>();
        const perfisMap = new Map<string, number>();
        const ofertasMap = new Map<string, number>();
        const ofertas2Map = new Map<string, number>();
        const promocionaisMap = new Map<string, number>();
        const promocionais2Map = new Map<string, number>();
        const jornadasMap = new Map<string, number>();
        const parceirosMap = new Map<string, number>();
        const subgruposMap = new Map<string, number>();
        const etapasMap = new Map<string, number>();
        const produtosMap = new Map<string, number>();
        const canaisMap = new Map<string, number>();

        // Helper para incrementar contagem
        const increment = (map: Map<string, number>, value: string | undefined | null) => {
            if (value && typeof value === 'string' && value.trim()) {
                const cleanValue = value.trim();
                map.set(cleanValue, (map.get(cleanValue) || 0) + 1);
            }
        };

        // Processar TODAS as activities do historico
        activities.forEach((activity: any) => {
            const raw = activity.raw || activity;

            // Filtragem inteligente: O historico deve ser relevante para a BU atual?
            // Se nao tiver BU selecionada, mostra tudo.
            // Se tiver BU selecionada, mostra apenas coisas dessa BU?
            // NAO: O usuario pode querer copiar uma estrategia de outra BU.
            // Mante-se global, mas o SmartOptions vai priorizar.

            increment(segmentosMap, raw.Segmento);
            increment(jornadasMap, raw.Jornada || raw.jornada);
            increment(canaisMap, raw.Canal || raw.canal);
            increment(parceirosMap, raw.Parceiro);
            increment(ofertasMap, raw.Oferta);
            increment(promocionaisMap, raw.Promocional);
            increment(ofertas2Map, raw['Oferta 2']);
            increment(promocionais2Map, raw['Promocional 2']);
            increment(perfisMap, raw['Perfil de Crédito']);
            increment(subgruposMap, raw.Subgrupos);
            increment(etapasMap, raw['Etapa de aquisição']);
            increment(produtosMap, raw.Produto);
        });

        // Helper para converter Map em array ordenado por frequencia
        const mapToSortedArray = (map: Map<string, number>): OptionWithFrequency[] => {
            return Array.from(map.entries())
                .map(([value, count]) => ({ value, count, isSmart: false }))
                .sort((a, b) => b.count - a.count); // Mais usado primeiro
        };

        return {
            segmentos: mapToSortedArray(segmentosMap),
            perfisCredito: mapToSortedArray(perfisMap),
            ofertas: mapToSortedArray(ofertasMap),
            ofertas2: mapToSortedArray(ofertas2Map),
            promocionais: mapToSortedArray(promocionaisMap),
            promocionais2: mapToSortedArray(promocionais2Map),
            jornadas: mapToSortedArray(jornadasMap),
            parceiros: mapToSortedArray(parceirosMap),
            subgrupos: mapToSortedArray(subgruposMap),
            etapasAquisicao: mapToSortedArray(etapasMap),
            produtos: mapToSortedArray(produtosMap),
            canais: mapToSortedArray(canaisMap),
        };
    }, [activities]);

    // 2. Mesclar com Opcoes SMART (Framework)
    const smartOptions = useMemo<HistoricalOptions>(() => {
        // Helpers para mesclagem
        const mergeOptions = (smartList: string[] | undefined, historicalList: OptionWithFrequency[]) => {
            if (!smartList || smartList.length === 0) return historicalList;

            // Converter smart em objetos OptionWithFrequency
            const smartObjs = smartList.map(val => ({ value: val, count: 999, isSmart: true }));

            // Filtrar historicos que JA estao na lista smart
            const smartSet = new Set(smartList);
            const pureHistorical = historicalList.filter(opt => !smartSet.has(opt.value));

            // Retornar Smart primeiro + Historico depois
            return [...smartObjs, ...pureHistorical];
        };

        // --- Lógica Hierárquica ---

        // 1. Segmentos baseados na BU
        const smartSegmentos = formData.bu ? BU_SEGMENTO_MAP[formData.bu] : [];

        // 2. Parceiros/Subgrupos baseados no Segmento
        const segmentContext = SEGMENTO_CONTEXT_MAP[formData.segmento] || {};
        const smartParceiros = segmentContext.parceiros || [];
        const smartSubgrupos = segmentContext.subgrupos || [];

        // 3. Detalhes (Promocional) baseados na Oferta
        const smartPromocionais = OFERTA_DETALHE_MAP[formData.oferta] || [];

        // 4. Jornadas do Framework (Extrair do CSV importado, não do histórico sujo)
        // Isso garante que apenas Jornadas "Oficiais" apareçam com estrela
        const smartJornadas = Array.from(new Set(
            frameworkData
                .map(row => row.Jornada || row.jornada) // FrameworkRow usually has Capitalized keys or lowercase depending on parsing
                .filter(Boolean)
        )) as string[];

        return {
            ...historicalOptions,
            segmentos: mergeOptions(smartSegmentos, historicalOptions.segmentos),
            parceiros: mergeOptions(smartParceiros, historicalOptions.parceiros),
            subgrupos: mergeOptions(smartSubgrupos, historicalOptions.subgrupos),
            promocionais: mergeOptions(smartPromocionais, historicalOptions.promocionais),
            jornadas: mergeOptions(smartJornadas, historicalOptions.jornadas),
        };
    }, [historicalOptions, formData.bu, formData.segmento, formData.oferta, frameworkData]);

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
            const ordemNum = typeof formData.ordemDisparo === 'number' ? formData.ordemDisparo : 1;
            const suggestedName = suggestActivityName(
                formData.bu,
                formData.segmento,
                formData.jornada,
                ordemNum,
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
                console.log('[DispatchForm] Calculando projeções IA:', {
                    bu: formData.bu,
                    segmento: formData.segmento,
                    activitiesCount: activities.length
                });
                const projectionInput = {
                    bu: formData.bu,
                    segmento: formData.segmento,
                    perfilCredito: formData.perfilCredito || undefined,
                    canal: formData.canal || undefined,
                    baseVolume: Number(formData.baseVolume) || undefined
                };
                const results = calculateProjections(activities as any, projectionInput);
                console.log('[DispatchForm] Projeções calculadas:', Object.keys(results));
                setProjections(results);
            } catch (error) {
                console.error('[DispatchForm] Erro ao calcular projecoes:', error);
                setProjections({});
            }
        } else {
            console.log('[DispatchForm] Condições não atendidas para projeções:', {
                bu: formData.bu,
                segmento: formData.segmento,
                activitiesCount: activities.length
            });
            setProjections({});
        }
    }, [formData.bu, formData.segmento, formData.perfilCredito, formData.canal, formData.baseVolume, activities]);

    // Effect 10: Auto-sugestão de Promocional baseado na Oferta
    useEffect(() => {
        if (formData.oferta && !editingActivity && !formData.promocional) {
            // Buscar promocional mais usado para esta oferta no histórico
            const matchingActivities = activities.filter((a: any) => {
                const raw = a.raw || a;
                return raw.Oferta === formData.oferta && raw.Promocional;
            });

            if (matchingActivities.length > 0) {
                // Contar frequência de cada promocional
                const promocionalCounts = new Map<string, number>();
                matchingActivities.forEach((a: any) => {
                    const raw = a.raw || a;
                    const promo = raw.Promocional;
                    if (promo) {
                        promocionalCounts.set(promo, (promocionalCounts.get(promo) || 0) + 1);
                    }
                });

                // Pegar o mais frequente
                let mostUsedPromo = '';
                let maxCount = 0;
                promocionalCounts.forEach((count, promo) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mostUsedPromo = promo;
                    }
                });

                if (mostUsedPromo) {
                    console.log('[DispatchForm] Auto-sugerindo Promocional:', mostUsedPromo, `(${maxCount}x usado)`);
                    setFormData(prev => ({ ...prev, promocional: mostUsedPromo }));
                }
            }
        }
    }, [formData.oferta, activities, editingActivity, formData.promocional]);

    // Effect 11: Auto-sugestão de Oferta 2 e Promocional 2 baseado no contexto
    useEffect(() => {
        if (formData.bu && formData.segmento && formData.oferta && !editingActivity) {
            // Buscar atividades similares com Oferta 2 preenchida
            const matchingActivities = activities.filter((a: any) => {
                const raw = a.raw || a;
                return raw.BU === formData.bu &&
                       raw.Segmento === formData.segmento &&
                       raw.Oferta === formData.oferta;
            });

            if (matchingActivities.length > 0) {
                // Auto-preencher Oferta 2 se não preenchido
                if (!formData.oferta2) {
                    const oferta2Counts = new Map<string, number>();
                    matchingActivities.forEach((a: any) => {
                        const raw = a.raw || a;
                        const of2 = raw['Oferta 2'];
                        if (of2) {
                            oferta2Counts.set(of2, (oferta2Counts.get(of2) || 0) + 1);
                        }
                    });

                    let mostUsed = '';
                    let maxCount = 0;
                    oferta2Counts.forEach((count, val) => {
                        if (count > maxCount) {
                            maxCount = count;
                            mostUsed = val;
                        }
                    });

                    if (mostUsed && maxCount >= 2) {
                        console.log('[DispatchForm] Auto-sugerindo Oferta 2:', mostUsed);
                        setFormData(prev => ({ ...prev, oferta2: mostUsed }));
                    }
                }

                // Auto-preencher Promocional 2 se não preenchido
                if (!formData.promocional2) {
                    const promo2Counts = new Map<string, number>();
                    matchingActivities.forEach((a: any) => {
                        const raw = a.raw || a;
                        const p2 = raw['Promocional 2'];
                        if (p2) {
                            promo2Counts.set(p2, (promo2Counts.get(p2) || 0) + 1);
                        }
                    });

                    let mostUsed = '';
                    let maxCount = 0;
                    promo2Counts.forEach((count, val) => {
                        if (count > maxCount) {
                            maxCount = count;
                            mostUsed = val;
                        }
                    });

                    if (mostUsed && maxCount >= 2) {
                        console.log('[DispatchForm] Auto-sugerindo Promocional 2:', mostUsed);
                        setFormData(prev => ({ ...prev, promocional2: mostUsed }));
                    }
                }
            }
        }
    }, [formData.bu, formData.segmento, formData.oferta, activities, editingActivity, formData.oferta2, formData.promocional2]);

    // Log de diagnóstico do estado do formulário
    useEffect(() => {
        console.log('[DispatchForm] Estado atual:', {
            bu: formData.bu,
            segmento: formData.segmento,
            jornada: formData.jornada,
            canal: formData.canal,
            oferta: formData.oferta,
            promocional: formData.promocional,
            oferta2: formData.oferta2,
            promocional2: formData.promocional2,
            baseVolume: formData.baseVolume,
            custoUnitarioOferta: formData.custoUnitarioOferta,
            custoUnitarioCanal: formData.custoUnitarioCanal,
            custoTotalCampanha: formData.custoTotalCampanha,
            projectionsKeys: Object.keys(projections),
            activitiesCount: activities.length
        });
    }, [formData, projections, activities]);

    const value = useMemo<DispatchFormContextValue>(() => ({
        formData,
        setFormData,
        handleChange,
        errors,
        setErrors,
        smartOptions, // <--- EXPORTANDO SMART OPTIONS
        projections,
        loading,
        setLoading,
        editingActivity,
        activities,
    }), [formData, handleChange, errors, smartOptions, projections, loading, editingActivity, activities]);

    return (
        <DispatchFormContext.Provider value={value}>
            {children}
        </DispatchFormContext.Provider>
    );
};

export default DispatchFormContext;
