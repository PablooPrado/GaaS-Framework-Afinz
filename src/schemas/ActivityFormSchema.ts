import { z } from 'zod';

/**
 * Schema de Validação para Formulário de Atividades (GaaS)
 */
export const ActivityFormSchema = z.object({
    bu: z.enum(['B2C', 'B2B2C', 'Plurix']),

    jornada: z.string()
        .min(5, 'Mínimo 5 caracteres')
        .max(250, 'Máximo 250 caracteres'),

    activityName: z.string()
        .min(2, 'Mínimo 2 caracteres')
        .max(250, 'Máximo 250 caracteres'),

    dataInicio: z.string()
        .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
            'Não pode ser data passada'),

    dataFim: z.string(),

    horarioDisparo: z.string()
        .regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),

    perfilCredito: z.string().optional(),
    oferta: z.string().optional(),
    promocional: z.string().optional(),
    oferta2: z.string().optional(),
    promocional2: z.string().optional(),

    parceiro: z.string().optional(),
    subgrupo: z.string().optional(),
    etapaAquisicao: z.string().optional(),
    produto: z.string().optional(),
    baseVolume: z.string().optional(),

    status: z.enum(['Rascunho', 'Scheduled', 'Enviado', 'Realizado']).default('Rascunho'),
})
    .refine(
        (data) => new Date(data.dataFim) >= new Date(data.dataInicio),
        { message: 'Data Fim ≥ Data Início', path: ['dataFim'] }
    )
    .refine(
        (data) => data.oferta || data.promocional,
        { message: 'Selecione pelo menos Oferta OU Promocional', path: ['oferta'] }
    );

export type ActivityFormInput = z.infer<typeof ActivityFormSchema>;
