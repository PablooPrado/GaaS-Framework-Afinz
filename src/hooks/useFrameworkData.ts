import { useState, useCallback, useMemo, useEffect } from 'react';
import { Activity, CalendarData, FrameworkRow } from '../types/framework';
import { formatDateKey } from '../utils/formatters';
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
        setFrameworkData(result.rows, result.activities);
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

  // CLOUD SYNC EFFECT
  useEffect(() => {
    const syncCloud = async () => {
      // If we have data, we are done loading
      if (storeActivities.length > 0) {
        setLoading(false);
        return;
      }

      // If already started sync, don't do anything (keep loading state as is)
      if (synced) return;

      setSynced(true);

      try {
        console.log('☁️ Verificando framework na nuvem...');
        // setLoading(true); // Already true by default

        const files = await storageService.listFiles('framework');
        if (files && files.length > 0) {
          console.log('📂 Arquivo encontrado:', files[0].name);
          const url = await storageService.getDownloadUrl('framework/' + files[0].name);
          const resp = await fetch(url);
          const blob = await resp.blob();
          const file = new File([blob], files[0].name, { type: blob.type });

          processCSV(file);
        } else {
          console.log('📭 Nenhum arquivo na nuvem.');
          setLoading(false);
        }
      } catch (e: any) {
        console.error('⚠️ Falha no Sync:', e);
        setLoading(false);
      }
    };

    // Run sync immediately
    syncCloud();
  }, [storeActivities.length, processCSV, synced]);

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
