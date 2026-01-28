import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from './DateRangePicker';

export const PeriodSelector: React.FC = () => {
    const { startDate, endDate, setPeriod, compareEnabled, toggleCompare } = usePeriod();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleApply = (start: Date, end: Date, compare: boolean) => {
        setPeriod(start, end);
        toggleCompare(compare);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all ${isOpen
                    ? 'bg-slate-900 border-white text-white'
                    : 'bg-slate-900/90 border-slate-700 text-white hover:bg-slate-900'
                    }`}
            >
                <CalendarIcon size={16} className="text-slate-400" />
                <span className="text-sm font-medium">
                    {format(startDate, "dd MMM, yyyy", { locale: ptBR })} - {format(endDate, "dd MMM, yyyy", { locale: ptBR })}
                </span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-[800px]">
                        <DateRangePicker
                            initialStartDate={startDate}
                            initialEndDate={endDate}
                            initialCompareEnabled={compareEnabled}
                            onApply={handleApply}
                            onCancel={() => setIsOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
