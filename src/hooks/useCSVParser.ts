import { useState } from 'react';
import Papa from 'papaparse';
import { B2CDataRow } from '../types/b2c';

export const useCSVParser = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseB2CCSV = (file: File): Promise<{ data: B2CDataRow[]; warnings: string[] }> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData: B2CDataRow[] = [];
                    const warnings: string[] = [];

                    // Log errors but don't block unless data is empty
                    if (results.errors.length > 0) {
                        console.warn('PapaParse encountered errors:', results.errors);
                        results.errors.forEach(e => warnings.push(`CSV Error: ${e.message}`));
                    }

                    if (!results.data || results.data.length === 0) {
                        setError('O arquivo CSV parece estar vazio ou inválido.');
                        setIsLoading(false);
                        reject(results.errors);
                        return;
                    }

                    results.data.forEach((row: any) => {
                        // Validate Date (row.Data or row.data)
                        const dataStr = row.Data || row.data;

                        if (!dataStr) {
                            // Skip empty rows without error
                            return;
                        }

                        // Parse numbers helper (Handles PT-BR format with dots as thousands)
                        const safeParseFloat = (val: any) => {
                            if (typeof val === 'number') return val;
                            if (!val) return 0;
                            // 1. Remove R$, %, and spaces
                            let clean = val.replace(/[R$\s%]/g, '');
                            // 2. Remove dots (thousands separator in pt-BR)
                            clean = clean.replace(/\./g, '');
                            // 3. Replace comma with dot (decimal separator)
                            clean = clean.replace(',', '.');
                            return parseFloat(clean) || 0;
                        };

                        parsedData.push({
                            data: dataStr,
                            propostas_b2c_total: safeParseFloat(row.Propostas_B2C_Total || row.propostas_b2c_total),
                            emissoes_b2c_total: safeParseFloat(row.Emissoes_B2C_Total || row.emissoes_b2c_total),
                            percentual_conversao_b2c: safeParseFloat(row['%_Conversao_B2C'] || row.percentual_conversao_b2c || row['%_conversao_b2c']),
                            observacoes: row.Observacoes || row.observacoes
                        });
                    });

                    if (parsedData.length === 0) {
                        setError('Nenhuma linha válida encontrada no CSV. Verifique o layout.');
                        setIsLoading(false);
                        return;
                    }

                    setIsLoading(false);
                    resolve({ data: parsedData, warnings });
                },
                error: (err) => {
                    setError('Erro crítico ao processar arquivo: ' + err.message);
                    setIsLoading(false);
                    reject(err);
                }
            });
        });
    };

    return { parseB2CCSV, isLoading, error };
};
