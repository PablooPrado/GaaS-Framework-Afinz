import { z } from 'zod';

/**
 * Schema de Validação para Formulário de Atividades (GaaS)
 */
export const ActivityFormSchema = z.object({
    bu: z.enum(['B2C', 'B2B2C', 'Plurix'], {
        required_error: 'BU é obrigatória'
    }),

    jornada: z.string()
        .min(5, 'Mínimo 5 caracteres')
        .max(150, 'Máximo 150 caracteres'),

    activityName: z.string()
        .min(5, 'Mínimo 5 caracteres')
        .max(150, 'Máximo 150 caracteres')
        // Regex simplificado permitindo alguns caracteres especiais comuns
        .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Apenas letras, números, underscore, hífen e espaços'),

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
