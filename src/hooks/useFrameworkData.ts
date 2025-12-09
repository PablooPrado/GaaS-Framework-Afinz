import { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { Activity, CalendarData, FrameworkRow } from '../types/framework';
import { parseDate, parseSafraToKey, formatDateKey, parseNumber, parseCurrency, parsePercentage } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';
import { FrameworkRowSchema } from '../schemas/frameworkSchema';
import { generateSimulatedData } from '../utils/simulatedData';

const normalizeColumnName = (col: string): string => {
  return col
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const findColumnByNormalized = (headers: string[], pattern: string): string | null => {
  const normalized = normalizeColumnName(pattern);
  return headers.find(h => normalizeColumnName(h) === normalized) || null;
};

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugHeaders, setDebugHeaders] = useState<string[]>([]);

  // Calculate totalActivities from store instead of state
  const totalActivities = storeActivities.length;

  // Derive CalendarData from store activities
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
    console.log('🔄 Iniciando processamento do CSV:', file.name);
    setLoading(true);
    setError(null);
    setDebugHeaders([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const rawRows = results.data as any[];

          if (rawRows.length === 0) {
            setError('Arquivo CSV vazio');
            setLoading(false);
            return;
          }

          // Normalize headers
          const headers = Object.keys(rawRows[0] || {});
          setDebugHeaders(headers);
          console.log('📋 Headers encontrados:', headers);

          // Map columns dynamically
          const columnMap: Record<string, string> = {};
          const requiredColumns = [
            'Activity name / Taxonomia', 'Data de Disparo', 'BU', 'Canal', 'Segmento', 'Jornada',
            'Base Total', 'Base Acionável', 'Taxa de Entrega', 'Propostas', 'Taxa de Proposta',
            'Aprovados', 'Taxa de Aprovação', 'Cartões Gerados', 'Taxa de Finalização',
            'Taxa de Conversão', 'Taxa de Abertura', 'CAC', 'Custo Total Campanha'
          ];

          // Helper to find column with synonyms
          const findCol = (name: string, synonyms: string[] = []) => {
            const found = findColumnByNormalized(headers, name);
            if (found) return found;
            for (const syn of synonyms) {
              const foundSyn = findColumnByNormalized(headers, syn);
              if (foundSyn) return foundSyn;
            }
            return null;
          };

          // Build map
          columnMap['Activity name / Taxonomia'] = findCol('Activity name / Taxonomia')!;
          columnMap['Data de Disparo'] = findCol('Data de Disparo')!;
          columnMap['BU'] = findCol('BU')!;
          columnMap['Canal'] = findCol('Canal')!;
          columnMap['Segmento'] = findCol('Segmento')!;
          columnMap['Jornada'] = findCol('Jornada')!;
          columnMap['Parceiro'] = findCol('Parceiro')!;
          columnMap['Safra'] = findCol('Safra', ['Ciclo', 'Mes', 'Mês'])!;
          columnMap['Oferta'] = findCol('Oferta', ['Tipo de Oferta', 'Tipo Oferta'])!;
          columnMap['Ordem de disparo'] = findCol('Ordem de disparo', ['Ordem', 'Step', 'Etapa'])!;
          columnMap['Disparado?'] = findCol('Disparado?', ['Disparado', 'Status Disparo', 'Status', 'Envio', 'Enviado?', 'Foi disparado?', 'Disparo Realizado'])!;

          // KPIs
          columnMap['Base Total'] = findCol('Base Total', ['Base Enviada'])!;
          columnMap['Base Acionável'] = findCol('Base Acionável', ['Base Entregue', 'Base Acionavel'])!;
          columnMap['Taxa de Entrega'] = findCol('Taxa de Entrega')!;
          columnMap['Propostas'] = findCol('Propostas')!;
          columnMap['Taxa de Proposta'] = findCol('Taxa de Proposta')!;
          columnMap['Aprovados'] = findCol('Aprovados')!;
          columnMap['Taxa de Aprovação'] = findCol('Taxa de Aprovação')!;
          columnMap['Cartões Gerados'] = findCol('Cartões Gerados', ['Emissões', 'Cartoes Gerados', 'Cartões', 'Contas Abertas', 'Contas'])!;
          columnMap['Taxa de Finalização'] = findCol('Taxa de Finalização')!;
          columnMap['Taxa de Conversão'] = findCol('Taxa de Conversão')!;
          columnMap['Taxa de Abertura'] = findCol('Taxa de Abertura')!;
          columnMap['CAC'] = findCol('CAC')!;
          columnMap['Custo Total Campanha'] = findCol('Custo Total Campanha')!;

          // Validate missing columns
          const missing = requiredColumns.filter(col => !columnMap[col]);
          if (missing.length > 0) {
            const critical = ['Activity name / Taxonomia', 'Data de Disparo', 'BU'];
            const missingCritical = critical.filter(c => missing.includes(c));

            if (missingCritical.length > 0) {
              throw new Error(`Colunas obrigatórias ausentes: ${missingCritical.join(', ')}`);
            }
          }

          const processedRows: FrameworkRow[] = [];
          const newActivities: Activity[] = [];

          let validCount = 0;
          let skipCount = 0;
          const errors: string[] = [];

          rawRows.forEach((row, idx) => {
            // Create a mapped object with standard keys
            const mappedRow: any = {};

            // Map known columns
            Object.entries(columnMap).forEach(([standardKey, csvKey]) => {
              if (csvKey) mappedRow[standardKey] = row[csvKey];
            });

            // DEBUG: Log first row raw values
            if (idx === 0) {
              console.log('🔬 PRIMEIRA LINHA RAW:', {
                'Base Total': row[columnMap['Base Total']],
                'Base Acionável': row[columnMap['Base Acionável']],
                'Taxa de Entrega': row[columnMap['Taxa de Entrega']],
                'Propostas': row[columnMap['Propostas']],
                'CAC': row[columnMap['CAC']],
                'Custo Total': row[columnMap['Custo Total Campanha']]
              });
            }

            // Zod Validation
            const validation = FrameworkRowSchema.safeParse(mappedRow);
            let validRow: FrameworkRow;

            if (validation.success) {
              validRow = validation.data as FrameworkRow;
            } else {
              // Soft Validation: If Zod fails, check if we have critical fields and try to proceed
              const msg = `Linha ${idx + 2}: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
              console.warn(`⚠️ Validação falhou (tentando processar mesmo assim): ${msg}`);

              // Check critical fields
              if (!mappedRow['Activity name / Taxonomia'] || !mappedRow['Data de Disparo']) {
                if (errors.length < 5) errors.push(msg);
                skipCount++;
                return;
              }

              // Use mappedRow as best effort. 
              // Note: mappedRow values are mostly strings from CSV, but our parsers (parseNumber, etc.) handle strings.
              validRow = mappedRow as FrameworkRow;
            }

            processedRows.push(validRow);

            // Create Activity object
            const date = parseDate(validRow['Data de Disparo']);
            if (!date) {
              if (errors.length < 5) errors.push(`Linha ${idx + 2}: Data inválida (${validRow['Data de Disparo']})`);
              skipCount++;
              return;
            }

            const buValue = validRow['BU'].toUpperCase() === 'PLURIX' ? 'Plurix' : validRow['BU'];

            // DEBUG: Log parsed numeric values for first row
            if (idx === 0) {
              console.log('🔬 VALORES PARSEADOS (primeira linha):', {
                baseEnviada: parseNumber(validRow['Base Total']),
                baseEntregue: parseNumber(validRow['Base Acionável']),
                taxaEntrega: parsePercentage(validRow['Taxa de Entrega']),
                propostas: parseNumber(validRow['Propostas']),
                cac: parseCurrency(validRow['CAC']),
                custoTotal: parseCurrency(validRow['Custo Total Campanha'])
              });
            }

            const activity: Activity = {
              id: validRow['Activity name / Taxonomia'],
              dataDisparo: date,
              canal: validRow['Canal'] || 'Desconhecido',
              bu: buValue as any,
              segmento: validRow['Segmento'] || 'Desconhecido',
              jornada: validRow['Jornada'] || 'Desconhecido',
              parceiro: validRow['Parceiro'] || 'Desconhecido',
              ordemDisparo: typeof validRow['Ordem de disparo'] === 'number' ? validRow['Ordem de disparo'] : undefined,
              oferta: validRow['Oferta'],
              safraKey: parseSafraToKey(validRow['Safra']) || undefined,
              kpis: {
                baseEnviada: parseNumber(validRow['Base Total']),
                baseEntregue: parseNumber(validRow['Base Acionável']),
                taxaEntrega: parsePercentage(validRow['Taxa de Entrega']),
                propostas: parseNumber(validRow['Propostas']),
                taxaPropostas: parsePercentage(validRow['Taxa de Proposta']),
                aprovados: parseNumber(validRow['Aprovados']),
                taxaAprovacao: parsePercentage(validRow['Taxa de Aprovação']),
                emissoes: parseNumber(validRow['Cartões Gerados']),
                taxaFinalizacao: parsePercentage(validRow['Taxa de Finalização']),
                taxaConversao: parsePercentage(validRow['Taxa de Conversão']),
                taxaAbertura: parsePercentage(validRow['Taxa de Abertura']),
                cartoes: parseNumber(validRow['Cartões Gerados']),
                cac: parseCurrency(validRow['CAC']),
                custoTotal: parseCurrency(validRow['Custo Total Campanha'])
              },
              raw: validRow
            };

            newActivities.push(activity);
            validCount++;
          });

          if (validCount === 0) {
            throw new Error(`Nenhuma linha válida encontrada. Erros: ${errors.join('; ')}`);
          }

          // Debug: Show first activity KPIs
          if (newActivities.length > 0) {
            console.log('🔍 Primeira atividade:', {
              id: newActivities[0].id,
              canal: newActivities[0].canal,
              bu: newActivities[0].bu,
              kpis: newActivities[0].kpis
            });
          }

          // Update Store
          setFrameworkData(processedRows, newActivities);
          console.log(`✅ Carregadas ${validCount} atividades, ${skipCount} linhas puladas`);
          setLoading(false);

        } catch (err) {
          console.error('❌ Erro no processamento:', err);
          setError('Erro ao processar arquivo: ' + (err as Error).message);
          setLoading(false);
        }
      },
      error: (err: Error) => {
        console.error('❌ Erro no Papa.parse:', err);
        setError('Erro ao ler arquivo CSV: ' + err.message);
        setLoading(false);
      }
    });
  }, [setFrameworkData]);

  const loadSimulatedData = useCallback(() => {
    console.log('🧪 loadSimulatedData CALLED');
    try {
      console.log('🔧 Gerando dados simulados (síncrono)...');
      const start = performance.now();
      const { rows, activities } = generateSimulatedData();
      const duration = performance.now() - start;
      console.log(`✅ Dados gerados em ${duration.toFixed(2)}ms: ${activities.length} atividades`);
      
      console.log('📝 Atualizando store com setFrameworkData...');
      setFrameworkData(rows, activities);
      
      console.log('🎉 Dados carregados com sucesso!');
    } catch (err) {
      console.error('❌ Erro:', err);
      setError('Erro ao gerar dados: ' + (err as Error).message);
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
