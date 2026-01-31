import React from 'react';
import { Info } from 'lucide-react';

/**
 * Componentes compartilhados para os blocos do formulario de disparo
 * Design: Compacto, Desktop-first, Dark mode
 */

// ========================================
// LABEL
// ========================================

interface LabelProps {
    label: string;
    required?: boolean;
    tooltip?: string;
}

export const Label: React.FC<LabelProps> = ({ label, required, tooltip }) => (
    <label className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
        {required && <span className="text-blue-500">*</span>}
        {tooltip && (
            <span title={tooltip} className="text-slate-600 hover:text-slate-400 cursor-help transition-colors">
                <Info size={9} />
            </span>
        )}
    </label>
);

// ========================================
// INPUT
// ========================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', error, ...props }) => (
    <div className="relative">
        <input
            className={`
                w-full px-2 py-1.5
                bg-slate-800/50 border rounded
                text-[11px] font-medium text-slate-200
                placeholder:text-slate-600
                focus:outline-none focus:ring-1 focus:ring-blue-500/50
                transition-all
                ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'}
                ${className}
            `}
            {...props}
        />
        {error && (
            <span className="absolute -bottom-3 left-0 text-[8px] text-red-400 font-medium truncate max-w-full">
                {error}
            </span>
        )}
    </div>
);

// ========================================
// SELECT
// ========================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: string;
}

export const Select: React.FC<SelectProps> = ({ className = '', error, children, ...props }) => (
    <div className="relative">
        <select
            className={`
                w-full px-2 py-1.5
                bg-slate-800/50 border rounded
                text-[11px] font-medium text-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500/50
                transition-all appearance-none cursor-pointer
                ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'}
                ${className}
            `}
            {...props}
        >
            {children}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m1 1 4 4 4-4" />
            </svg>
        </div>
        {error && (
            <span className="absolute -bottom-3 left-0 text-[8px] text-red-400 font-medium truncate max-w-full">
                {error}
            </span>
        )}
    </div>
);

// ========================================
// SECTION CARD
// ========================================

interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    headerClassName?: string;
    badge?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    children,
    headerClassName = 'text-slate-300',
    badge
}) => (
    <section className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-2 hover:border-slate-600/50 transition-colors duration-300 h-full">
        <div className={`flex items-center justify-between pb-1.5 border-b border-slate-700/50 ${headerClassName}`}>
            <div className="flex items-center gap-1.5">
                <div className="opacity-70 text-slate-400">{icon}</div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider">{title}</h3>
            </div>
            {badge && (
                <span className="px-1 py-0.5 bg-slate-700/50 rounded text-[8px] text-slate-400 font-bold uppercase">
                    {badge}
                </span>
            )}
        </div>
        <div className="flex-1 flex flex-col">
            {children}
        </div>
    </section>
);

// ========================================
// METRIC CARD (para painel IA)
// ========================================

interface MetricCardProps {
    label: string;
    value?: number;
    prefix?: string;
    suffix?: string;
    isInt?: boolean;
    confidence?: number;
    compact?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    prefix = '',
    suffix = '',
    isInt = false,
    confidence,
    compact = false
}) => (
    <div className={`
        bg-slate-900/50 border border-indigo-500/10 rounded
        ${compact ? 'p-1.5' : 'p-2'}
        flex flex-col items-center justify-center text-center
    `}>
        <span className={`uppercase font-bold text-indigo-400 ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
            {label}
        </span>
        <div className={`font-bold text-indigo-200 ${compact ? 'text-xs' : 'text-sm'}`}>
            {value !== undefined ? (
                <>
                    <span className="text-[9px] text-indigo-500 mr-0.5">{prefix}</span>
                    {isInt ? Math.round(value).toLocaleString('pt-BR') : value.toFixed(2)}
                    <span className="text-[9px] text-indigo-500 ml-0.5">{suffix}</span>
                </>
            ) : (
                <span className="text-slate-500">-</span>
            )}
        </div>
        {confidence !== undefined && confidence > 0 && (
            <div className="w-full mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-500/50 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, confidence)}%` }}
                />
            </div>
        )}
    </div>
);

// ========================================
// READONLY FIELD
// ========================================

interface ReadonlyFieldProps {
    label: string;
    value: string | number;
    className?: string;
}

export const ReadonlyField: React.FC<ReadonlyFieldProps> = ({ label, value, className = '' }) => (
    <div className={`bg-slate-900/40 p-1.5 rounded border border-slate-700/50 ${className}`}>
        <Label label={label} />
        <div className="text-[11px] text-slate-300 font-mono text-center">
            {value || '-'}
        </div>
    </div>
);
