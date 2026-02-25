import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
    Search, Download, Save, AlertCircle, X, History, Archive,
    ChevronRight, ChevronDown, FolderOpen, Folder,
    ArrowUp, ArrowDown, ArrowUpDown, FileText, Database
} from 'lucide-react';
import Papa from 'papaparse';
import { FrameworkRow } from '../types/framework';
import { useVersionManager } from '../hooks/useVersionManager';
import { SaveVersionModal } from './SaveVersionModal';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';

// ─── Config ───────────────────────────────────────────────────────────────────

const BU_CONFIG: Record<string, { dot: string; text: string; folder: string }> = {
    'B2C':   { dot: 'bg-blue-400',    text: 'text-blue-300',    folder: 'text-blue-400'    },
    'B2B2C': { dot: 'bg-emerald-400', text: 'text-emerald-300', folder: 'text-emerald-400' },
    'Plurix':{ dot: 'bg-purple-400',  text: 'text-purple-300',  folder: 'text-purple-400'  },
};

const CANAL_EMOJI: Record<string, string> = {
    'E-mail':    '✉',
    'SMS':       '💬',
    'WhatsApp':  '📱',
    'Push':      '🔔',
};

// Primary columns shown in the table (keeps it scannable)
const DISPLAY_COLS: { key: string; label: string; cls: string }[] = [
    { key: 'Activity name / Taxonomia', label: 'Taxonomia / Activity Name', cls: 'min-w-[260px] max-w-xs' },
    { key: 'Segmento',                  label: 'Campanha',                   cls: 'min-w-[120px]'           },
    { key: 'Jornada',                   label: 'Jornada',                    cls: 'min-w-[120px]'           },
    { key: 'Data de Disparo',           label: 'Data',                       cls: 'min-w-[100px]'           },
    { key: 'Disparado?',                label: 'Status',                     cls: 'min-w-[80px]'            },
    { key: 'Cartões Gerados',           label: 'Cartões',                    cls: 'min-w-[80px] text-right' },
    { key: 'Taxa de Conversão',         label: 'Conv %',                     cls: 'min-w-[70px] text-right' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Highlight({ text, term }: { text: string; term: string }) {
    const str = String(text ?? '');
    if (!term || !str) return <>{str}</>;
    const idx = str.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return <>{str}</>;
    return (
        <>
            {str.slice(0, idx)}
            <mark className="bg-amber-400/30 text-amber-200 rounded-sm">{str.slice(idx, idx + term.length)}</mark>
            {str.slice(idx + term.length)}
        </>
    );
}

function StatusBadge({ value }: { value: string }) {
    const v = String(value ?? '').toLowerCase();
    if (v === 'sim')  return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Enviado</span>;
    if (v === 'não' || v === 'nao') return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400 border border-slate-600">Pendente</span>;
    return <span className="text-slate-400 text-xs">{value || '—'}</span>;
}

interface SelectedNode { bu?: string; canal?: string }

// ─── Component ────────────────────────────────────────────────────────────────

export const FrameworkView: React.FC = () => {
    const { frameworkData, setFrameworkData, activities } = useAppStore();

    // Search + tree selection
    const [searchTerm, setSearchTerm]       = useState('');
    const [selected, setSelected]           = useState<SelectedNode>({});
    const [expandedBUs, setExpandedBUs]     = useState<Set<string>>(new Set());

    // Row detail
    const [expandedRow, setExpandedRow]     = useState<number | null>(null);

    // Table sort (for non-search view)
    const [sortConfig, setSortConfig]       = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    // Inline edits
    const [edits, setEdits]                 = useState<{ [idx: number]: Partial<FrameworkRow> }>({});

    // Version / history UI
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen]     = useState(false);

    const { versions, currentVersion, saveNewVersion, restoreVersion, deleteVersion, exportVersion, storageUsage } = useVersionManager();

    // ── Build tree structure ────────────────────────────────────────────────

    const tree = useMemo(() => {
        const buMap = new Map<string, Map<string, FrameworkRow[]>>();
        frameworkData.forEach(row => {
            const bu    = row.BU    || 'N/A';
            const canal = row.Canal || 'N/A';
            if (!buMap.has(bu))              buMap.set(bu, new Map());
            const canalMap = buMap.get(bu)!;
            if (!canalMap.has(canal))        canalMap.set(canal, []);
            canalMap.get(canal)!.push(row);
        });
        return buMap;
    }, [frameworkData]);

    const allColumns = useMemo(() => frameworkData.length > 0 ? Object.keys(frameworkData[0]) : [], [frameworkData]);

    // ── Row matching for search ─────────────────────────────────────────────

    const rowMatchesSearch = useCallback((row: FrameworkRow, term: string): boolean => {
        if (!term) return true;
        const lc = term.toLowerCase();
        return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(lc));
    }, []);

    // ── Filtered + grouped rows ─────────────────────────────────────────────

    // When searching: return groups [{bu, canal, rows[]}]
    // When not searching: return flat list filtered by selected node
    const searchGroups = useMemo(() => {
        if (!searchTerm) return null;
        const groups: { bu: string; canal: string; rows: (FrameworkRow & { _origIdx: number })[] }[] = [];
        frameworkData.forEach((row, idx) => {
            if (!rowMatchesSearch(row, searchTerm)) return;
            const bu    = row.BU    || 'N/A';
            const canal = row.Canal || 'N/A';
            // If a node is selected, filter to just that branch
            if (selected.bu && selected.bu !== bu) return;
            if (selected.canal && selected.canal !== canal) return;
            const g = groups.find(g => g.bu === bu && g.canal === canal);
            if (g) g.rows.push({ ...row, _origIdx: idx });
            else   groups.push({ bu, canal, rows: [{ ...row, _origIdx: idx }] });
        });
        return groups;
    }, [searchTerm, frameworkData, selected, rowMatchesSearch]);

    // buNodes that match search (for tree highlight)
    const matchingBUs = useMemo(() => {
        if (!searchTerm) return new Set<string>();
        return new Set(
            frameworkData
                .filter(r => rowMatchesSearch(r, searchTerm))
                .map(r => r.BU || 'N/A')
        );
    }, [searchTerm, frameworkData, rowMatchesSearch]);

    const matchingCanals = useMemo(() => {
        if (!searchTerm) return new Map<string, Set<string>>();
        const m = new Map<string, Set<string>>();
        frameworkData.forEach(r => {
            if (!rowMatchesSearch(r, searchTerm)) return;
            const bu = r.BU || 'N/A', canal = r.Canal || 'N/A';
            if (!m.has(bu)) m.set(bu, new Set());
            m.get(bu)!.add(canal);
        });
        return m;
    }, [searchTerm, frameworkData, rowMatchesSearch]);

    // Flat rows for non-search mode
    const flatRows = useMemo(() => {
        if (searchTerm) return [];
        let data = frameworkData.map((row, idx) => ({ ...row, _origIdx: idx }));
        if (selected.bu)    data = data.filter(r => (r.BU    || 'N/A') === selected.bu);
        if (selected.canal) data = data.filter(r => (r.Canal || 'N/A') === selected.canal);
        if (sortConfig.key) {
            data.sort((a, b) => {
                const k = sortConfig.key!;
                const va = String((edits[a._origIdx] as any)?.[k] ?? (a as any)[k] ?? '');
                const vb = String((edits[b._origIdx] as any)?.[k] ?? (b as any)[k] ?? '');
                const na = parseFloat(va.replace(',', '.'));
                const nb = parseFloat(vb.replace(',', '.'));
                if (!isNaN(na) && !isNaN(nb)) return sortConfig.direction === 'asc' ? na - nb : nb - na;
                return sortConfig.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        }
        return data;
    }, [searchTerm, frameworkData, selected, sortConfig, edits]);

    // ── Auto-expand tree nodes on search ────────────────────────────────────

    React.useEffect(() => {
        if (searchTerm && matchingBUs.size > 0) {
            setExpandedBUs(new Set(matchingBUs));
        }
    }, [searchTerm, matchingBUs]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const toggleBU = (bu: string) => {
        setExpandedBUs(prev => {
            const next = new Set(prev);
            next.has(bu) ? next.delete(bu) : next.add(bu);
            return next;
        });
    };

    const selectNode = (bu?: string, canal?: string) => {
        setSelected({ bu, canal });
        setExpandedRow(null);
        if (bu && !expandedBUs.has(bu)) setExpandedBUs(prev => new Set([...prev, bu]));
    };

    const handleSort = (key: string) => {
        setSortConfig(c => {
            if (c.key === key) {
                if (c.direction === 'asc') return { key, direction: 'desc' };
                return { key: null, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleCellEdit = (origIdx: number, col: string, value: string) => {
        setEdits(prev => ({ ...prev, [origIdx]: { ...prev[origIdx], [col]: value } }));
    };

    const handleQuickSave = () => {
        const merged = frameworkData.map((row, idx) => edits[idx] ? { ...row, ...edits[idx] } : row);
        setFrameworkData(merged, activities);
        setEdits({});
    };

    const handleSaveVersion = (name: string, description: string) => {
        const merged = frameworkData.map((row, idx) => edits[idx] ? { ...row, ...edits[idx] } : row);
        try {
            saveNewVersion(name, merged, description, Object.keys(edits).length);
            setFrameworkData(merged, activities);
            setEdits({});
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleRestoreVersion = (id: string) => {
        if (Object.keys(edits).length > 0 && !confirm('Edições não salvas serão descartadas. Continuar?')) return;
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
        const data = frameworkData.map((row, idx) => edits[idx] ? { ...row, ...edits[idx] } : row);
        const csv  = Papa.unparse(data, { delimiter: ';', quotes: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.setAttribute('download', 'campanhas_editado.csv');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    // ── Count helpers ────────────────────────────────────────────────────────

    const canalMatchCount = (bu: string, canal: string) =>
        searchTerm
            ? (matchingCanals.get(bu)?.has(canal) ? (searchGroups?.find(g => g.bu === bu && g.canal === canal)?.rows.length ?? 0) : 0)
            : (tree.get(bu)?.get(canal)?.length ?? 0);

    const buMatchCount = (bu: string) =>
        searchTerm
            ? (searchGroups?.filter(g => g.bu === bu).reduce((s, g) => s + g.rows.length, 0) ?? 0)
            : (tree.get(bu) ? [...(tree.get(bu)!.values())].reduce((s, rows) => s + rows.length, 0) : 0);

    const totalCount = searchTerm
        ? (searchGroups?.reduce((s, g) => s + g.rows.length, 0) ?? 0)
        : frameworkData.length;

    // ─── Empty state ────────────────────────────────────────────────────────

    if (frameworkData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <AlertCircle size={48} className="opacity-40" />
                <p className="text-sm">Nenhum dado carregado. Faça upload do CSV na tela inicial.</p>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
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

            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700 bg-slate-800/60 shrink-0">
                {/* Search */}
                <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-400 transition" />
                    <input
                        type="text"
                        placeholder="Buscar — abre no conteúdo certo..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setSelected({}); }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                    {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setSelected({}); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Search hit count pill */}
                {searchTerm && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 shrink-0">
                        {totalCount} resultado{totalCount !== 1 ? 's' : ''}
                    </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    {currentVersion && (
                        <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                            <Archive size={11} />
                            <span className="max-w-[130px] truncate">{currentVersion.name}</span>
                        </span>
                    )}
                    <button onClick={() => setIsHistoryOpen(true)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition" title="Histórico de Versões">
                        <History size={17} />
                    </button>
                    {Object.keys(edits).length > 0 && (
                        <>
                            <span className="text-xs text-amber-400 bg-amber-900/25 border border-amber-500/30 px-2 py-1 rounded">
                                {Object.keys(edits).length} edições
                            </span>
                            <button onClick={handleQuickSave}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition">
                                Aplicar
                            </button>
                        </>
                    )}
                    <button onClick={() => setIsSaveModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition">
                        <Save size={14} /> Salvar Versão
                    </button>
                    <button onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition">
                        <Download size={14} /> Exportar
                    </button>
                </div>
            </div>

            {/* ── Main area (tree + content) ────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Explorer Tree ───────────────────────────── */}
                <aside className="w-60 shrink-0 border-r border-slate-700 bg-slate-900 flex flex-col overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                        <Database size={12} />
                        Explorador
                    </div>
                    <nav className="flex-1 overflow-y-auto py-1 select-none">
                        {/* Root node */}
                        <button
                            onClick={() => { selectNode(); setSearchTerm(''); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition rounded-none ${
                                !selected.bu && !searchTerm
                                    ? 'bg-blue-600/20 text-blue-200'
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <FolderOpen size={15} className="text-amber-400 shrink-0" />
                            <span className="flex-1 text-left truncate font-medium">Todos os Disparos</span>
                            <span className="text-xs text-slate-500">{frameworkData.length}</span>
                        </button>

                        {/* BU nodes */}
                        {[...tree.keys()].map(bu => {
                            const buCfg     = BU_CONFIG[bu] || BU_CONFIG['B2C'];
                            const isExpanded = expandedBUs.has(bu);
                            const hasMatch  = !searchTerm || matchingBUs.has(bu);
                            const count     = buMatchCount(bu);
                            if (searchTerm && !hasMatch) return null;

                            return (
                                <div key={bu}>
                                    {/* BU row */}
                                    <button
                                        onClick={() => {
                                            toggleBU(bu);
                                            selectNode(bu, undefined);
                                            if (searchTerm) setSearchTerm('');
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition ${
                                            selected.bu === bu && !selected.canal
                                                ? 'bg-blue-600/20 text-blue-200'
                                                : 'text-slate-300 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="text-slate-500 shrink-0">
                                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                        </span>
                                        {isExpanded
                                            ? <FolderOpen size={14} className={`${buCfg.folder} shrink-0`} />
                                            : <Folder     size={14} className={`${buCfg.folder} shrink-0`} />
                                        }
                                        <span className={`flex-1 text-left truncate font-semibold ${buCfg.text}`}>{bu}</span>
                                        <span className={`text-xs ${searchTerm && hasMatch ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>{count}</span>
                                    </button>

                                    {/* Canal children */}
                                    {isExpanded && [...(tree.get(bu)?.keys() ?? [])].map(canal => {
                                        const canalHasMatch = !searchTerm || matchingCanals.get(bu)?.has(canal);
                                        const cCount = canalMatchCount(bu, canal);
                                        if (searchTerm && !canalHasMatch) return null;
                                        const isSelected = selected.bu === bu && selected.canal === canal;
                                        return (
                                            <button
                                                key={canal}
                                                onClick={() => { selectNode(bu, canal); if (searchTerm) setSearchTerm(''); }}
                                                className={`w-full flex items-center gap-2 pl-9 pr-3 py-1 text-xs transition ${
                                                    isSelected
                                                        ? 'bg-blue-600/20 text-blue-200'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                <FileText size={12} className="shrink-0 opacity-60" />
                                                <span className="flex-1 text-left truncate">
                                                    {CANAL_EMOJI[canal] ? `${CANAL_EMOJI[canal]} ` : ''}{canal}
                                                </span>
                                                <span className={`text-xs ${searchTerm && canalHasMatch ? 'text-amber-400 font-semibold' : 'text-slate-600'}`}>{cCount}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* ── Right: Content ────────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Breadcrumb bar */}
                    <div className="px-4 py-1.5 border-b border-slate-800 bg-slate-900/80 flex items-center gap-1 text-xs text-slate-500 shrink-0">
                        <span className="hover:text-slate-300 cursor-pointer" onClick={() => { selectNode(); setSearchTerm(''); }}>Framework</span>
                        {selected.bu && (
                            <>
                                <ChevronRight size={11} />
                                <span className={`${BU_CONFIG[selected.bu]?.text ?? 'text-slate-300'} font-medium cursor-pointer hover:opacity-80`}
                                    onClick={() => selectNode(selected.bu, undefined)}>
                                    {selected.bu}
                                </span>
                            </>
                        )}
                        {selected.canal && (
                            <>
                                <ChevronRight size={11} />
                                <span className="text-slate-300 font-medium">{selected.canal}</span>
                            </>
                        )}
                        {searchTerm && (
                            <>
                                <ChevronRight size={11} />
                                <span className="text-amber-300">"{searchTerm}"</span>
                            </>
                        )}
                        <span className="ml-auto text-slate-600">
                            {totalCount} {searchTerm ? 'resultado' : 'linha'}{totalCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* ── SEARCH RESULTS VIEW ─────────────────────────── */}
                    {searchTerm && searchGroups ? (
                        <div className="flex-1 overflow-y-auto">
                            {searchGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                    <Search size={32} className="opacity-30" />
                                    <p className="text-sm">Nenhum resultado para "{searchTerm}"</p>
                                </div>
                            ) : (
                                searchGroups.map(group => {
                                    const buCfg = BU_CONFIG[group.bu] || BU_CONFIG['B2C'];
                                    return (
                                        <div key={`${group.bu}-${group.canal}`} className="border-b border-slate-800">
                                            {/* Group header — acts like a file path */}
                                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 sticky top-0 z-10">
                                                <span className={`w-2 h-2 rounded-full ${buCfg.dot} shrink-0`} />
                                                <span className={`font-semibold text-xs ${buCfg.text}`}>{group.bu}</span>
                                                <ChevronRight size={11} className="text-slate-600" />
                                                <span className="text-xs text-slate-300 font-medium">
                                                    {CANAL_EMOJI[group.canal] ? `${CANAL_EMOJI[group.canal]} ` : ''}{group.canal}
                                                </span>
                                                <span className="ml-auto text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                                    {group.rows.length} resultado{group.rows.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Rows in this group */}
                                            {group.rows.map(row => {
                                                const isExpanded = expandedRow === row._origIdx;
                                                return (
                                                    <div key={row._origIdx} className="border-b border-slate-800/50">
                                                        {/* Summary row */}
                                                        <button
                                                            onClick={() => setExpandedRow(isExpanded ? null : row._origIdx)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition text-left"
                                                        >
                                                            <FileText size={13} className="text-slate-500 shrink-0 mt-0.5" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-slate-200 font-mono truncate leading-relaxed">
                                                                    <Highlight text={String(row['Activity name / Taxonomia'] ?? '')} term={searchTerm} />
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                    <span className="text-xs text-slate-500">
                                                                        <Highlight text={String(row['Segmento'] ?? '')} term={searchTerm} />
                                                                    </span>
                                                                    {row['Jornada'] && (
                                                                        <span className="text-xs text-slate-600">
                                                                            <Highlight text={String(row['Jornada'] ?? '')} term={searchTerm} />
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-slate-600">{row['Data de Disparo']}</span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={13} className={`text-slate-600 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </button>

                                                        {/* Expanded detail */}
                                                        {isExpanded && (
                                                            <RowDetail row={row} origIdx={row._origIdx} edits={edits} allColumns={allColumns} searchTerm={searchTerm} onEdit={handleCellEdit} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    ) : (
                        /* ── TABLE VIEW (no search) ─────────────────────── */
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse text-xs text-left">
                                <thead className="bg-slate-800 text-slate-400 sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-2.5 border-b border-slate-700 w-8 text-center text-slate-600 sticky left-0 bg-slate-800 border-r border-slate-700">#</th>
                                        {DISPLAY_COLS.map(col => (
                                            <th key={col.key}
                                                onClick={() => handleSort(col.key)}
                                                className={`px-3 py-2.5 border-b border-slate-700 font-medium whitespace-nowrap cursor-pointer hover:bg-slate-700 hover:text-slate-200 transition select-none group ${col.cls}`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {col.label}
                                                    {sortConfig.key === col.key
                                                        ? (sortConfig.direction === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />)
                                                        : <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-40 transition" />
                                                    }
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-3 py-2.5 border-b border-slate-700 w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {flatRows.map((row, i) => {
                                        const isExpanded = expandedRow === row._origIdx;
                                        const buCfg = BU_CONFIG[row.BU] || BU_CONFIG['B2C'];
                                        return (
                                            <React.Fragment key={row._origIdx}>
                                                <tr className={`group transition hover:bg-slate-800/70 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/20'}`}>
                                                    <td className={`px-2 py-2 text-slate-600 text-center border-r border-slate-800 sticky left-0 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/20'} group-hover:bg-slate-800/70 transition`}>
                                                        {i + 1}
                                                    </td>
                                                    {DISPLAY_COLS.map(col => {
                                                        const val = (edits[row._origIdx] as any)?.[col.key] ?? (row as any)[col.key] ?? '';
                                                        const edited = (edits[row._origIdx] as any)?.[col.key] !== undefined;

                                                        if (col.key === 'Disparado?') {
                                                            return (
                                                                <td key={col.key} className="px-3 py-2">
                                                                    <StatusBadge value={String(val)} />
                                                                </td>
                                                            );
                                                        }
                                                        if (col.key === 'Activity name / Taxonomia') {
                                                            return (
                                                                <td key={col.key} className="px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${buCfg.dot}`} />
                                                                        <span className={`font-mono text-slate-200 truncate max-w-xs ${edited ? 'text-amber-200' : ''}`}>{val}</span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                        return (
                                                            <td key={col.key} className={`px-3 py-2 text-slate-400 ${edited ? 'text-amber-300 bg-amber-900/10' : ''}`}>
                                                                {String(val || '—')}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => setExpandedRow(isExpanded ? null : row._origIdx)}
                                                            className="text-slate-600 hover:text-slate-300 transition"
                                                            title="Ver / editar todos os campos"
                                                        >
                                                            <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={DISPLAY_COLS.length + 2} className="p-0 border-b border-slate-700">
                                                            <RowDetail row={row} origIdx={row._origIdx} edits={edits} allColumns={allColumns} searchTerm="" onEdit={handleCellEdit} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {flatRows.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                                    <Folder size={32} className="opacity-30" />
                                    <p className="text-sm">Nenhuma linha nesta pasta</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Footer ──────────────────────────────────────────── */}
                    <div className="bg-slate-800/60 border-t border-slate-700 px-4 py-1.5 text-xs text-slate-500 flex justify-between items-center shrink-0">
                        <span>Total no framework: <strong className="text-slate-300">{frameworkData.length}</strong> linhas</span>
                        <span>Visualizando: <strong className="text-slate-300">{totalCount}</strong> linhas</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Row Detail Panel ─────────────────────────────────────────────────────────

interface RowDetailProps {
    row: FrameworkRow & { _origIdx: number };
    origIdx: number;
    edits: { [idx: number]: Partial<FrameworkRow> };
    allColumns: string[];
    searchTerm: string;
    onEdit: (origIdx: number, col: string, value: string) => void;
}

const RowDetail: React.FC<RowDetailProps> = ({ row, origIdx, edits, allColumns, searchTerm, onEdit }) => {
    const filteredCols = allColumns.filter(c => c !== '_origIdx');

    return (
        <div className="bg-slate-900/80 border-t border-slate-700/50 px-6 py-4">
            <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">Todos os campos — clique para editar</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredCols.map(col => {
                    const val    = (edits[origIdx] as any)?.[col] ?? (row as any)[col] ?? '';
                    const edited = (edits[origIdx] as any)?.[col] !== undefined;
                    return (
                        <div key={col} className={`rounded-md p-2 border transition ${edited ? 'border-amber-500/40 bg-amber-900/10' : 'border-slate-700/50 bg-slate-800/40'}`}>
                            <label className="block text-xs text-slate-500 mb-1 truncate" title={col}>{col}</label>
                            <input
                                type="text"
                                value={String(val)}
                                onChange={e => onEdit(origIdx, col, e.target.value)}
                                className={`w-full bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 transition ${edited ? 'text-amber-200 font-medium' : 'text-slate-300'}`}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
