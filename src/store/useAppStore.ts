
import { create } from 'zustand';
import { FrameworkRow, ViewSettings, Goal, JournalEntry, FilterState, Activity } from '../types/framework';
import { B2CDataRow, AlertConfig } from '../types/b2c';

interface AppState {
    // Data
    frameworkData: FrameworkRow[];
    activities: Activity[]; // Processed activities for easier consumption
    goals: Goal[];
    journal: JournalEntry[];

    // UI State
    viewSettings: ViewSettings;

    // Actions
    setFrameworkData: (data: FrameworkRow[], activities: Activity[]) => void;
    setGoals: (goals: Goal[]) => void;
    addJournalEntry: (entry: JournalEntry) => void;
    updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
    updateActivity: (id: string, updates: Partial<Activity>) => void;

    // Filter Actions
    setGlobalFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;

    // Navigation Actions
    setTab: (tab: ViewSettings['abaAtual']) => void;
    setPeriodo: (inicio: string, fim: string) => void;

    // B2C Actions
    b2cData: B2CDataRow[];
    setB2CData: (data: B2CDataRow[]) => void;
    alertConfig: AlertConfig;
    setAlertConfig: (config: AlertConfig) => void;
}

const INITIAL_FILTERS: FilterState = {
    bu: [],
    canais: [],
    jornadas: [],
    segmentos: [],
    parceiros: [],
    ofertas: [],
    disparado: 'Todos',
    dataInicio: '',
    dataFim: ''
};

export const useAppStore = create<AppState>((set) => ({
    frameworkData: [],
    activities: [],
    goals: [],
    journal: [],

    viewSettings: {
        periodo: { inicio: '', fim: '' }, // Should be initialized with current month
        abaAtual: 'launch',
        filtrosGlobais: INITIAL_FILTERS,
        modoTempoJornada: 'diario'
    },

    setFrameworkData: (data, activities) => set({ frameworkData: data, activities }),

    setGoals: (goals) => set({ goals }),

    addJournalEntry: (entry) => set((state) => ({
        journal: [...state.journal, entry]
    })),

    updateJournalEntry: (id, entry) => set((state) => ({
        journal: state.journal.map(j => j.id === id ? { ...j, ...entry } : j)
    })),

    updateActivity: (id, updates) => set((state) => ({
        activities: state.activities.map((a) => (a.id === id ? { ...a, ...updates } : a))
    })),

    setGlobalFilters: (filters) => set((state) => ({
        viewSettings: {
            ...state.viewSettings,
            filtrosGlobais: { ...state.viewSettings.filtrosGlobais, ...filters }
        }
    })),

    resetFilters: () => set((state) => ({
        viewSettings: {
            ...state.viewSettings,
            filtrosGlobais: INITIAL_FILTERS
        }
    })),

    setTab: (tab) => set((state) => ({
        viewSettings: { ...state.viewSettings, abaAtual: tab }
    })),

    setPeriodo: (inicio, fim) => set((state) => ({
        viewSettings: { ...state.viewSettings, periodo: { inicio, fim } }
    })),

    // B2C State
    b2cData: [],
    setB2CData: (data) => set({ b2cData: data }),

    alertConfig: {
        share_crm_limiar: 10,
        ativar_anomalias: true
    },
    setAlertConfig: (config) => set({ alertConfig: config })
}));
