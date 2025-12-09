import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MetaMensal } from '../types/framework';

interface MetaStore {
    metas: MetaMensal[];

    // Actions
    setMeta: (meta: Omit<MetaMensal, 'id' | 'created_at' | 'updated_at'>) => void;
    getMeta: (mes: string, bu: string) => MetaMensal | undefined;
    getMetasMes: (mes: string) => MetaMensal[];
    deleteMeta: (id: string) => void;

    // Computed
    getMetaConsolidada: (mes: string) => {
        cartoes_meta: number;
        pedidos_meta: number;
        cac_max_medio: number;
    };
}

export const useMetaStore = create<MetaStore>()(
    persist(
        (set, get) => ({
            metas: [],

            setMeta: (metaData) => {
                const id = `${metaData.mes}-${metaData.bu}`;
                const now = new Date().toISOString();

                set((state) => {
                    const existingIndex = state.metas.findIndex(
                        m => m.mes === metaData.mes && m.bu === metaData.bu
                    );

                    if (existingIndex >= 0) {
                        // Atualizar existente
                        const updated = [...state.metas];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            ...metaData,
                            updated_at: now,
                        };
                        return { metas: updated };
                    } else {
                        // Criar nova
                        return {
                            metas: [
                                ...state.metas,
                                {
                                    id,
                                    ...metaData,
                                    created_at: now,
                                    updated_at: now,
                                },
                            ],
                        };
                    }
                });
            },

            getMeta: (mes, bu) => {
                return get().metas.find(m => m.mes === mes && m.bu === bu);
            },

            getMetasMes: (mes) => {
                return get().metas.filter(m => m.mes === mes);
            },

            deleteMeta: (id) => {
                set((state) => ({
                    metas: state.metas.filter(m => m.id !== id),
                }));
            },

            getMetaConsolidada: (mes) => {
                const metasMes = get().metas.filter(m => m.mes === mes);
                if (metasMes.length === 0) {
                    return { cartoes_meta: 0, pedidos_meta: 0, cac_max_medio: 0 };
                }

                return {
                    cartoes_meta: metasMes.reduce((sum, m) => sum + m.cartoes_meta, 0),
                    pedidos_meta: metasMes.reduce((sum, m) => sum + m.pedidos_meta, 0),
                    cac_max_medio: metasMes.reduce((sum, m) => sum + m.cac_max, 0) / metasMes.length,
                };
            },
        }),
        {
            name: 'growth-brain-metas',
            version: 1,
        }
    )
);
