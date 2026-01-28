
import { supabase } from './supabaseClient';
import { Activity, FrameworkRow } from '../types/framework';
import { DailyAdMetrics } from '../schemas/paid-media';
import { B2CDataRow } from '../types/b2c';

// Helper to map SQL row to Activity
const mapSqlToActivity = (row: any): Activity => {
    // Reconstruct Raw Object (for compatibility)
    const raw: FrameworkRow = {
        'Activity name / Taxonomia': row.activity_id,
        'Data de Disparo': row.data_disparo,
        'Data Fim': row.data_fim,
        'BU': row.bu,
        'Canal': row.canal,
        'Segmento': row.segmento,
        'SIGLA.1': row.segmento_sigla,
        'Subgrupos': row.subgrupo,
        'Jornada': row.jornada,
        'Etapa de aquisição': row.etapa_aquisicao,
        'Ordem de disparo': row.ordem_disparo,
        'Parceiro': row.parceiro,
        'SIGLA': row.parceiro_sigla,
        'Safra': row.safra,
        'Perfil de Crédito': row.perfil_credito,
        'Produto': row.produto,
        'Oferta': row.oferta,
        'SIGLA.2': row.oferta_sigla,
        'Oferta 2': row.oferta_2,
        'Promocional': row.promocional,
        'Promocional 2': row.promocional_2,
        'Disparado?': row.disparado,
        'Base Total': row.base_total,
        'Base Acionável': row.base_acionavel,
        '% Otimização de base': row.optimizacao_base,
        'Base Enviada': row.base_enviada,
        'Custo Unitário Oferta': row.custo_unitario_oferta,
        'Custo Total da Oferta': row.custo_total_oferta,
        'Custo unitário do canal': row.custo_unitario_canal,
        'Custo total canal': row.custo_total_canal,
        'Custo Total Campanha': row.custo_total_campanha,
        // Rates
        'Taxa de Entrega': row.taxa_entrega,
        'Taxa de Abertura': row.taxa_abertura,
        'Taxa de Clique': row.taxa_clique,
        'Taxa de Proposta': row.taxa_proposta,
        'Taxa de Aprovação': row.taxa_aprovacao,
        'Taxa de Finalização': row.taxa_finalizacao,
        'Taxa de Conversão': row.taxa_conversao,
        // KPIs
        'Propostas': row.propostas,
        'Aprovados': row.aprovados,
        'Cartões Gerados': row.cartoes_gerados,
        'CAC': row.cac,
    };

    return {
        id: row.activity_id,
        dataDisparo: new Date(row.data_disparo),
        canal: row.canal,
        bu: row.bu,
        segmento: row.segmento,
        parceiro: row.parceiro,
        jornada: row.jornada,
        ordemDisparo: Number(row.ordem_disparo) || undefined,
        oferta: row.oferta,
        promocional: row.promocional,
        safraKey: row.safra, // Ensure this matches logic? typically YYYY-MM
        kpis: {
            baseEnviada: row.base_enviada,
            baseEntregue: null,
            taxaEntrega: row.taxa_entrega,
            propostas: row.propostas,
            taxaPropostas: row.taxa_proposta,
            aprovados: row.aprovados,
            taxaAprovacao: row.taxa_aprovacao,
            emissoes: row.emissoes,
            taxaFinalizacao: row.taxa_finalizacao,
            taxaConversao: row.taxa_conversao,
            taxaAbertura: row.taxa_abertura,
            cartoes: row.cartoes_gerados,
            cac: row.cac,
            custoTotal: row.custo_total
        },
        raw
    };
};

export const dataService = {
    async fetchActivities(): Promise<Activity[]> {
        // Order by date desc
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            //.eq('filename', 'migration_v3_full') // Optional: constrain to latest? Or just take all?
            // User might want to append new data later.
            .order('data_disparo', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapSqlToActivity);
    },

    async fetchB2CMetrics(): Promise<B2CDataRow[]> {
        const { data, error } = await supabase
            .from('b2c_daily_metrics')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            data: row.data, // YYYY-MM-DD
            propostas_b2c_total: row.propostas_total,
            emissoes_b2c_total: row.emissoes_total,
            percentual_conversao_b2c: row.percentual_conversao,
            observacoes: row.observacoes
        }));
    },

    async fetchPaidMedia(): Promise<DailyAdMetrics[]> {
        const { data, error } = await supabase
            .from('paid_media_metrics')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            date: new Date(row.date),
            channel: row.channel,
            campaign: row.campaign,
            objective: row.objective,
            spend: row.spend,
            impressions: row.impressions,
            clicks: row.clicks,
            conversions: row.conversions,
            ctr: row.ctr,
            cpc: row.cpc,
            cpm: row.cpm,
            cpa: row.cpa
        }));
    }
};
