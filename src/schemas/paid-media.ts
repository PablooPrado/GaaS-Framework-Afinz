import { z } from 'zod';

export const AdChannelSchema = z.enum(['meta', 'google', 'tiktok', 'unknown']);

export const DailyAdMetricsSchema = z.object({
    date: z.date(), // Date object (parsed from Excel serial or string)
    channel: AdChannelSchema,
    campaign: z.string(),
    objective: z.enum(['brand', 'conversion', 'unknown']).optional(),

    // Core Metrics
    spend: z.number().min(0).default(0),
    impressions: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0),
    conversions: z.number().int().min(0).default(0),

    // Calculated (Optional in raw data, computed later)
    ctr: z.number().optional(),
    cpc: z.number().optional(),
    cpm: z.number().optional(),
    cpa: z.number().optional(),
});

export type DailyAdMetrics = z.infer<typeof DailyAdMetricsSchema>;

export const BudgetSchema = z.object({
    id: z.string(),
    channel: AdChannelSchema,
    value: z.number().min(0),
    month: z.string(), // YYYY-MM
});

export type Budget = z.infer<typeof BudgetSchema>;
