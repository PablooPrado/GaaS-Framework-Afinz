import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Search, Download, Save, AlertCircle, X, ArrowUp, ArrowDown, ArrowUpDown, History, Archive } from 'lucide-react';
import Papa from 'papaparse';
import { FrameworkRow } from '../types/framework';
import { useVersionManager } from '../hooks/useVersionManager';
import { SaveVersionModal } from './SaveVersionModal';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';

export const FrameworkView: React.FC = () => {
    const { frameworkData, setFrameworkData, activities, viewSettings } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [edits, setEdits] = useState<{ [rowIndex: number]: Partial<FrameworkRow> }>({});
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const {
        versions,
        currentVersion,
        saveNewVersion,
        restoreVersion,
        deleteVersion,
        exportVersion,
        storageUsage
    } = useVersionManager();

    // Auto-create initial version if none exists and we have data
    useEffect(() => {
        if (frameworkData.length > 0 && versions.length === 0) {
            saveNewVersion('Original - Importado', frameworkData, 'Versão inicial criada automaticamente ao importar CSV.');
        }
    }, [frameworkData.length, versions.length, saveNewVersion, frameworkData]);

    // Get all unique columns from the data
    const columns = useMemo(() => {
        if (frameworkData.length === 0) return [];
        return Object.keys(frameworkData[0]);
    }, [frameworkData]);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' };
                return { key: null, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Process data (Filter + Sort)
    const processedData = useMemo(() => {
        // 1. Create a shallow copy with original index to track edits
        let data = frameworkData.map((row, index) => ({ ...row, _originalIndex: index }));

        // 2. Global Filters
        const filters = viewSettings.filtrosGlobais;
        data = data.filter(row => {
            // BU Filter
            if (filters.bu.length > 0 && !filters.bu.includes(row.BU)) return false;

            // Channel Filter
            if (filters.canais.length > 0 && !filters.canais.includes(row.Canal)) return false;

            // Segment Filter
            if (filters.segmentos.length > 0 && !filters.segmentos.includes(row.Segmento)) return false;

            // Partner Filter
            if (filters.parceiros.length > 0 && !filters.parceiros.includes(row.Parceiro)) return false;

            return true;
        });

        // 3. Local Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(row => {
                return Object.values(row).some(val =>
                    String(val).toLowerCase().includes(lowerTerm)
                );
            });
        }

        // 4. Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                const key = sortConfig.key!;
                // Use edited value if available, otherwise original
                const valA = (edits[a._originalIndex] as any)?.[key] ?? (a as any)[key];
                const valB = (edits[b._originalIndex] as any)?.[key] ?? (b as any)[key];

                if (valA === valB) return 0;

                // Handle numbers
                const numA = Number(String(valA).replace(',', '.').replace(/[^0-9.-]+/g, ''));
                const numB = Number(String(valB).replace(',', '.').replace(/[^0-9.-]+/g, ''));

                if (!isNaN(numA) && !isNaN(numB) && String(valA).trim() !== '' && String(valB).trim() !== '') {
                    return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                }

                // Handle strings
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();

                if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [frameworkData, searchTerm, sortConfig, edits, viewSettings.filtrosGlobais]);

    const handleCellChange = (originalIndex: number, column: string, value: string) => {
        setEdits(prev => ({
            ...prev,
            [originalIndex]: {
                ...prev[originalIndex],
                [column]: value
            }
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent, element: HTMLInputElement) => {
        if (e.key === 'Enter') {
            element.blur();
        }
        if (e.key === 'Escape') {
            element.blur();
        }
    };

    const handleQuickSave = () => {
        // Just update memory (store)
        const newData = frameworkData.map((row, idx) => {
            if (edits[idx]) {
                return { ...row, ...edits[idx] };
            }
            return row;
        });

        setFrameworkData(newData, activities);
        setEdits({});
    };

    const handleSaveVersion = (name: string, description: string) => {
        // 1. Merge edits
        const newData = frameworkData.map((row, idx) => {
            if (edits[idx]) {
                return { ...row, ...edits[idx] };
            }
            return row;
        });

        // 2. Save to version history
        try {
            saveNewVersion(name, newData, description, Object.keys(edits).length);

            // 3. Update store
            setFrameworkData(newData, activities);
            setEdits({});

            alert('Versão salva com sucesso!');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleRestoreVersion = (id: string) => {
        if (Object.keys(edits).length > 0) {
            if (!confirm('Você tem edições não salvas. Restaurar uma versão anterior irá descartá-las. Continuar?')) {
                return;
            }
        }

        try {
            const data = restoreVersion(id);
            setFrameworkData(data, activities);
            setEdits({});
            setIsHistoryOpen(false);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleExport = () => {
        const dataToExport = frameworkData.map((row, idx) => {
            if (edits[idx]) {
                return { ...row, ...edits[idx] };
            }
            return row;
        });

        const csv = Papa.unparse(dataToExport, {
            delimiter: ";",
            quotes: true
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'framework_editado.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (frameworkData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p>Nenhum dado carregado. Faça upload do CSV na tela inicial.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 relative">
            <SaveVersionModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveVersion}
                pendingEditsCount={Object.keys(edits).length}
            />

            <VersionHistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                versions={versions}
                currentVersionId={currentVersion?.id || null}
                onRestore={handleRestoreVersion}
                onDelete={deleteVersion}
                onExport={exportVersion}
                storageUsage={storageUsage}
            />

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between gap-4 bg-slate-800/50">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-400 transition" />
                    <input
                        type="text"
                        placeholder="Buscar em todas as colunas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Version Info */}
                    {currentVersion && (
                        <div className="hidden md:flex items-center gap-2 mr-4 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                            <Archive size={12} />
                            <span className="max-w-[150px] truncate">{currentVersion.name}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-sm font-medium transition"
                        title="Histórico de Versões"
                    >
                        <History size={18} />
                    </button>

                    {Object.keys(edits).length > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                            <span className="text-amber-400 text-xs font-medium bg-amber-900/30 px-2 py-1 rounded border border-amber-500/30">
                                {Object.keys(edits).length} alterações
                            </span>
                            <button
                                onClick={handleQuickSave}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition"
                                title="Aplicar na memória (sem criar nova versão)"
                            >
                                Aplicar
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-900/20"
                    >
                        <Save size={16} />
                        Salvar Versão
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition"
                    >
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full border-collapse text-sm text-left relative">
                    <thead className="bg-slate-800 text-slate-400 sticky top-0 z-20 shadow-lg">
                        <tr>
                            <th className="p-3 border-b border-slate-600 font-medium w-12 text-center sticky left-0 z-30 bg-slate-800 border-r border-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                                #
                            </th>
                            {columns.map(col => (
                                <th
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    className="p-3 border-b border-slate-700 font-medium whitespace-nowrap min-w-[150px] cursor-pointer hover:bg-slate-700 hover:text-slate-200 transition select-none group"
                                >
                                    <div className="flex items-center gap-2">
                                        {col}
                                        <span className="text-slate-600 group-hover:text-slate-400">
                                            {sortConfig.key === col ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />
                                            ) : (
                                                <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition" />
                                            )}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {processedData.map((row, index) => {
                            const originalIndex = row._originalIndex;

                            return (

                                <tr key={originalIndex} className={`transition group ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'} hover:bg-slate-700`}>
                                    <td className={`p-2 text-slate-400 text-xs text-center border-r border-slate-600 sticky left-0 z-10 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'} group-hover:bg-slate-700 transition shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]`}>
                                        {index + 1}
                                    </td>
                                    {columns.map(col => {
                                        const value = (edits[originalIndex] as any)?.[col] ?? (row as any)[col];
                                        const cellEdited = (edits[originalIndex] as any)?.[col] !== undefined;

                                        return (

                                            <td key={col} className={`p-0 border-r border-slate-700/50 relative ${cellEdited ? 'bg-amber-900/20' : ''}`}>
                                                <input
                                                    type="text"
                                                    value={value as string}
                                                    onChange={(e) => handleCellChange(originalIndex, col, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, e.currentTarget)}
                                                    className={`w-full h-full p-3 bg-transparent border-none outline-none text-slate-300 focus:bg-slate-800 focus:ring-1 focus:ring-inset focus:ring-blue-500 transition ${cellEdited ? 'text-amber-200 font-medium' : ''
                                                        }`}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {processedData.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Nenhum resultado encontrado para "{searchTerm}"
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="bg-slate-800 border-t border-slate-700 p-2 px-4 text-xs text-slate-400 flex justify-between items-center">
                <span>Total: <strong>{frameworkData.length}</strong> linhas</span>
                <span>Mostrando: <strong>{processedData.length}</strong> linhas</span>
            </div>
        </div>
    );
};
