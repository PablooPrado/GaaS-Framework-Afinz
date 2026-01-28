import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarData } from '../types/framework';
import { formatDateKey, parseDate } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';
import { generateSimulatedData } from '../utils/simulatedData';
import { storageService } from '../services/storageService';
import CsvWorker from '../workers/csvWorker?worker'; // Import Worker
import { WorkerMessage, WorkerResponse } from '../workers/csvWorker';

export const useFrameworkData = (): {
  data: CalendarData;
  loading: boolean;
  error: string | null;
  totalActivities: number;
  processCSV: (file: File) => void;
  loadSimulatedData: () => void;
  debugHeaders: string[];
} => {
  const { setFrameworkData, activities: storeActivities } = useAppStore();
  const [loading, setLoading] = useState(true); // Start true to prevent flash
  const [error, setError] = useState<string | null>(null);
  const [debugHeaders, setDebugHeaders] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);

  const totalActivities = storeActivities.length;

  const data = useMemo(() => {
    const grouped: CalendarData = {};
    storeActivities.forEach(activity => {
      const dateKey = formatDateKey(activity.dataDisparo);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    return grouped;
  }, [storeActivities]);

  const processCSV = useCallback((file: File) => {
    console.log('🔄 Iniciando processamento do CSV (Worker):', file.name);
    setLoading(true);
    setError(null);
    setDebugHeaders([]);

    const worker = new CsvWorker();
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const msg: WorkerMessage = { type: 'PARSE_FRAMEWORK_CSV', fileContent: text };
      worker.postMessage(msg);
    };

    reader.onerror = () => {
      setError('Erro ao ler arquivo.');
      setLoading(false);
      worker.terminate();
    };

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type } = e.data;

      if (type === 'SUCCESS') {
        const result = (e.data as any).data; // { rows, activities }
        console.log(`✅ Worker Finalizado: ${result.activities.length} atividades`);

        // Fix: Hydrate dates that are serialized as strings during worker transfer
        // Use parseDate to ensure we get Local Midnight (avoiding timezone shift to prev day)
        const hydratedActivities = result.activities.map((a: any) => {
          const d = (typeof a.dataDisparo === 'string' ? parseDate(a.dataDisparo) : a.dataDisparo) || new Date(a.dataDisparo);

          // Heuristic Fix for Timezone Shift:
          // If hours are 21:00 (typical of UTC midnight displayed in Brazil), shift to Next Day 00:00
          if (d instanceof Date && !isNaN(d.getTime()) && d.getHours() === 21) {
            d.setDate(d.getDate() + 1);
            d.setHours(0);
          }
          return {
            ...a,
            dataDisparo: d
          };
        });

        if (result.warnings && result.warnings.length > 0) {
          console.warn('Import Warnings:', result.warnings);
          // Alert user so they know rows are missing
          alert(`⚠️ ATENÇÃO: ${result.warnings.length} linhas foram ignoradas!\nProvável erro de data/formato.\n\nErros:\n${result.warnings.slice(0, 3).join('\n')}`);
        }

        setFrameworkData(result.rows, hydratedActivities);
        // Optionally setDebugHeaders if worker returns them? (We didn't pass them back in worker logic, but that's fine for now)
        setLoading(false);
      } else if (type === 'ERROR') {
        setError((e.data as any).error);
        setLoading(false);
      }
      worker.terminate();
    };

    worker.onerror = (err) => {
      setError('Erro no Worker: ' + err.message);
      setLoading(false);
      worker.terminate();
    };

    reader.readAsText(file);
  }, [setFrameworkData]);

  // CLOUD SYNC EFFECT (Refactored to Supabase)
  useEffect(() => {
    const loadFromSupabase = async () => {

      // 1. Wait for Persist Hydration (Fix Race Condition)
      if (useAppStore.persist && !useAppStore.persist.hasHydrated()) {
        console.log('⏳ Aguardando hidratação do storage...');
        await new Promise<void>((resolve) => {
          const unsub = useAppStore.persist.onFinishHydration(() => {
            resolve();
          });
        });
        console.log('💧 Storage hidratado.');
      }

      const { activities, setB2CData, setPaidMediaData } = useAppStore.getState();

      // Cache First Strategy: If we have data (especially activities), don't re-fetch immediately
      // This prevents overwriting the just-uploaded CSV if migration hasn't run yet.
      // Cache First Strategy: If we have BOTH activities and B2C data, don't re-fetch immediately
      // This prevents overwriting the just-uploaded CSV if migration hasn't run yet.
      if (activities.length > 0 && b2cData.length > 0) {
        setLoading(false);
        return;
      }

      // Avoid double fetching
      if (synced) return;
      setSynced(true);

      try {
        console.log('📡 Conectando ao Supabase para buscar dados...');
        import('../services/dataService').then(async ({ dataService }) => {
          const [fetchedActivities, fetchedB2C, fetchedPaid] = await Promise.all([
            dataService.fetchActivities(),
            dataService.fetchB2CMetrics(),
            dataService.fetchPaidMedia()
          ]);

          console.log(`✅ Dados Carregados: ${fetchedActivities.length} Atividades, ${fetchedB2C.length} B2C, ${fetchedPaid.length} Media.`);

          // Reconstruct "rows" from raw data for compatibility
          const rows = fetchedActivities.map(a => a.raw || {});

          let finalB2C = fetchedB2C;
          // FALLBACK: If Supabase B2C is empty, try Storage (Legacy)
          if (fetchedB2C.length === 0) {
            try {
              const files = await storageService.listFiles('b2c');
              if (files && files.length > 0) {
                console.log('🔄 Fallback B2C: Found in Storage:', files[0].name);
                const url = await storageService.getDownloadUrl('b2c/' + files[0].name);
                const resp = await fetch(url);
                const blob = await resp.blob();
                const text = await blob.text();

                // Parse with Worker
                finalB2C = await new Promise<any[]>((resolve) => {
                  const worker = new CsvWorker();
                  worker.postMessage({ type: 'PARSE_B2C_CSV', fileContent: text } as WorkerMessage);
                  worker.onmessage = (e) => {
                    if (e.data.type === 'SUCCESS' || e.data.type === 'SUCCESS_B2C') {
                      resolve(((e.data as any).data) || []);
                    } else {
                      resolve([]);
                    }
                    worker.terminate();
                  };
                  worker.onerror = () => { resolve([]); worker.terminate(); };
                });
                console.log(`✅ Fallback Loaded: ${finalB2C.length} B2C rows.`);
              }
            } catch (fallbackErr) {
              console.warn('Fallback B2C failed:', fallbackErr);
            }
          }

          setFrameworkData(rows, fetchedActivities);
          setB2CData(finalB2C);
          setPaidMediaData(fetchedPaid);
          setLoading(false);
        }).catch(err => {
          console.error('Erro ao importar dataService:', err);
          setError('Fail to load data service');
          setLoading(false);
        });

      } catch (e: any) {
        console.error('⚠️ Falha no Carregamento SQL:', e);
        // Do not set error visibly if we just failed to fetch empty data?
        // But if connection error, show it.
        setError('Erro de conexão com Banco de Dados.');
        setLoading(false);
      }
    };

    loadFromSupabase();
  }, [setFrameworkData, synced]);

  const loadSimulatedData = useCallback(() => {
    try {
      setLoading(true);
      const { rows, activities } = generateSimulatedData();
      setFrameworkData(rows, activities);
      setLoading(false);
    } catch (err: any) {
      setError('Erro ao gerar dados: ' + err.message);
      setLoading(false);
    }
  }, [setFrameworkData]);

  return {
    data,
    loading,
    error,
    totalActivities,
    processCSV,
    loadSimulatedData,
    debugHeaders
  };
};
