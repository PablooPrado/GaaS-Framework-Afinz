import React, { useState, useMemo } from 'react';
import { DailyAnalysis } from '../../types/b2c';
import { ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface OriginacaoTableProps {
    data: DailyAnalysis[];
    onRowClick?: (date: string) => void;
}

type SortKey = keyof DailyAnalysis | 'date_timestamp';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

export const OriginacaoTable: React.FC<OriginacaoTableProps> = ({ data, onRowClick }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'data', direction: 'desc' }); // Default sort by date desc

    // Sorting Logic
    const sortedData = useMemo(() => {
        const sorted = [...data];

        sorted.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof DailyAnalysis];
            const bValue = b[sortConfig.key as keyof DailyAnalysis];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [data, sortConfig]);

    // Apply Pagination AND Sorting
    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort
    };

    const getSortIcon = (name: SortKey) => {
        if (sortConfig.key === name) {
            // User Request: Arrow Up = Newest First (Descending for Date)
            // Standard: Asc (Up) / Desc (Down)
            // We will Flip the visual icon: Ascending Config -> Arrow Down, Descending Config -> Arrow Up
            // Wait, standard is: Asc = Arrow Up (Small to Large). Desc = Arrow Down (Large to Small).
            // User wants: Arrow Up = Newest (Large Date) at top. 
            // So when direction is 'desc' (Newest First), show Arrow Up.
            return sortConfig.direction === 'asc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />;
        }
        return <ArrowUpDown size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    };

    const handleExport = () => {
        // Use sortedData instead of raw data
        const headers = [
            'Data', 'Prop CRM', 'Emiss CRM', 'Prop B2C Total', 'Emiss B2C Total',
            '% Share Prop', '% Share Emiss', '% Conv CRM', '% Conv B2C', 'Perf Index', 'CAC'
        ];

        const rows = sortedData.map(d => [
            d.data,
            d.propostas_crm,
            d.emissoes_crm,
            d.propostas_b2c_total,
            d.emissoes_b2c_total,
            d.share_propostas_crm_percentual.toFixed(2).replace('.', ','),
            d.share_emissoes_crm_percentual.toFixed(2).replace('.', ','),
            d.taxa_conversao_crm.toFixed(2).replace('.', ','),
            d.taxa_conversao_b2c.toFixed(2).replace('.', ','),
            d.performance_index.toFixed(2).replace('.', ','),
            d.cac_medio.toFixed(2).replace(',', '.')
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(r => r.join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `originacao_b2c_sorted.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper for easier header code
    const SortableHeader = ({ label, sortKey, align = 'right' }: { label: string, sortKey: SortKey, align?: string }) => (
        <th
            className={`px-4 py-3 cursor-pointer hover:bg-slate-800 transition select-none group ${align === 'right' ? 'text-right' : 'text-left'}`}
            onClick={() => requestSort(sortKey)}
        >
            <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden mt-6 shadow-lg">
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-300">Detalhamento Diário</h3>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                >
                    <Download size={14} /> Exportar ({sortedData.length})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                        <tr>
                            <SortableHeader label="Data" sortKey="data" align="left" />
                            <SortableHeader label="Vol. Entregas" sortKey="entregas_crm" />
                            <SortableHeader label="Custo" sortKey="custo_crm" />
                            <SortableHeader label="Prop CRM" sortKey="propostas_crm" />
                            <SortableHeader label="Emiss CRM" sortKey="emissoes_crm" />
                            <SortableHeader label="Prop B2C" sortKey="propostas_b2c_total" />
                            <SortableHeader label="Emiss B2C" sortKey="emissoes_b2c_total" />
                            <SortableHeader label="% Share" sortKey="share_emissoes_crm_percentual" />
                            <SortableHeader label="% Conv CRM" sortKey="taxa_conversao_crm" />
                            <SortableHeader label="% Conv B2C" sortKey="taxa_conversao_b2c" />
                            <SortableHeader label="CAC" sortKey="cac_medio" />
                            {/* Status column removed */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {paginatedData.map((row) => (
                            <tr
                                key={row.data}
                                className={`cursor-pointer hover:bg-slate-700/50 transition ${row.eh_anomalia ? 'bg-red-900/10' : ''}`}
                                onClick={() => onRowClick && onRowClick(row.data)}
                            >
                                <td className="px-4 py-2 font-medium text-slate-200 whitespace-nowrap">
                                    {row.data.split('-').reverse().join('/')}
                                </td>
                                <td className="px-4 py-2 text-right">{row.entregas_crm.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">R$ {row.custo_crm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-2 text-right">{row.propostas_crm}</td>
                                <td className="px-4 py-2 text-right font-bold text-white">{row.emissoes_crm}</td>
                                <td className="px-4 py-2 text-right text-slate-500">{row.propostas_b2c_total}</td>
                                <td className="px-4 py-2 text-right text-slate-500">{row.emissoes_b2c_total}</td>
                                <td className="px-4 py-2 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.share_emissoes_crm_percentual < 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                        }`}>
                                        {row.share_emissoes_crm_percentual.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right text-emerald-400">
                                    {row.taxa_conversao_crm.toFixed(1)}%
                                </td>
                                <td className="px-4 py-2 text-right text-slate-500">
                                    {row.taxa_conversao_b2c.toFixed(1)}%
                                </td>
                                <td className="px-4 py-2 text-right">R$ {row.cac_medio.toFixed(0)}</td>
                                {/* Status column removed */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-700/50 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs text-slate-400">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};
