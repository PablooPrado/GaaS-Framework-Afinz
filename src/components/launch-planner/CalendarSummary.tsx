import React, { useMemo } from 'react';
import { format, isSameDay, startOfWeek, isSameMonth, addMonths, subMonths, getDay, startOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarData } from '../../types/framework';

interface CalendarSummaryProps {
    data: CalendarData;
    onDayClick?: (date: Date) => void;
    displayDate: Date;
    onMonthChange: (date: Date) => void;
}

export const CalendarSummary: React.FC<CalendarSummaryProps> = ({ data, onDayClick, displayDate, onMonthChange }) => {
    // Generate calendar grid days for the displayDate month (Fixed 6 weeks / 42 days)
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(displayDate);
        const start = startOfWeek(monthStart);

        // Always generate 42 days (6 rows x 7 cols) to maintain consistent layout
        return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    }, [displayDate]);

    // Update display month AND update the period filter
    const handleMonthChange = (newDate: Date) => {
        onMonthChange(newDate);
    };

    // Flatten data
    const allActivities = useMemo(() => Object.values(data).flat(), [data]);

    const getDayMetrics = (day: Date) => {
        const activities = allActivities.filter(a => isSameDay(a.dataDisparo, day));
        const count = activities.length;

        // Group by BU to determine colors
        const byBU = activities.reduce((acc, curr) => {
            acc[curr.bu] = (acc[curr.bu] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate by KPI (cartões/emissões) to find dominant BU
        const byBUCartoes = activities.reduce((acc, curr) => {
            acc[curr.bu] = (acc[curr.bu] || 0) + (curr.kpis.cartoes || 0);
            return acc;
        }, {} as Record<string, number>);

        return { count, byBU, byBUCartoes };
    };

    const getDominantBUColor = (byBUCartoes: Record<string, number>) => {
        if (Object.keys(byBUCartoes).length === 0) return 'bg-slate-800/30 border-slate-700/50';

        const dominantBU = Object.entries(byBUCartoes).sort((a, b) => b[1] - a[1])[0][0];

        switch (dominantBU?.toUpperCase()) {
            case 'B2C': return 'bg-blue-900/40 border-blue-700/50 hover:bg-blue-900/60 hover:border-blue-600/70';
            case 'B2B2C': return 'bg-emerald-900/40 border-emerald-700/50 hover:bg-emerald-900/60 hover:border-emerald-600/70';
            case 'PLURIX': return 'bg-purple-900/40 border-purple-700/50 hover:bg-purple-900/60 hover:border-purple-600/70';
            default: return 'bg-slate-800/30 border-slate-700/50';
        }
    };

    const getBUColor = (bu: string) => {
        switch (bu?.toUpperCase()) {
            case 'B2C': return 'bg-blue-600 hover:bg-blue-500';
            case 'B2B2C': return 'bg-emerald-600 hover:bg-emerald-500';
            case 'PLURIX': return 'bg-purple-600 hover:bg-purple-500';
            default: return 'bg-slate-600 hover:bg-slate-500';
        }
    };

    const isWeekend = (day: Date) => {
        const dayOfWeek = getDay(day);
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full flex flex-col">
            {/* Header com navegação */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleMonthChange(subMonths(displayDate, 1))}
                        className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                        title="Mês anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-lg font-bold text-white uppercase min-w-[200px] text-center">
                        {format(displayDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <button
                        onClick={() => handleMonthChange(addMonths(displayDate, 1))}
                        className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                        title="Próximo mês"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div
                        key={i}
                        className={`text-center text-xs font-semibold py-2 ${i === 0 || i === 6 ? 'text-blue-400' : 'text-slate-500'
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid de dias */}
            <div className="flex-1 overflow-y-auto flex justify-center">
                <div className="grid grid-cols-7 gap-1 w-full max-w-[560px]">
                    {calendarDays.map((day) => {
                        const { count, byBU, byBUCartoes } = getDayMetrics(day);
                        const isCurrentMonth = isSameMonth(day, displayDate);
                        const isToday = isSameDay(day, new Date());
                        const weekend = isWeekend(day);

                        const buEntries = Object.entries(byBU).sort((a, b) => b[1] - a[1]);
                        const dominantBUColor = getDominantBUColor(byBUCartoes);

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => onDayClick?.(day)}
                                className={`
                                relative p-1 rounded-md border transition-all cursor-pointer aspect-square overflow-hidden group
                                ${isCurrentMonth
                                        ? weekend
                                            ? 'bg-blue-950/30 border-blue-800/40 hover:bg-blue-950/50 hover:border-blue-700/60'
                                            : dominantBUColor
                                        : 'bg-slate-900/20 border-slate-800/30 opacity-20'
                                    }
                                ${isToday ? 'ring-1 ring-blue-400 ring-offset-1 ring-offset-slate-900' : ''}
                            `}
                            >
                                <div className="absolute top-1 left-0 right-0 flex justify-center">
                                    <span className={`text-[10px] font-semibold ${isToday
                                        ? 'text-blue-300'
                                        : weekend
                                            ? 'text-blue-400'
                                            : 'text-slate-300'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {count > 0 && (
                                    <div className="absolute inset-x-0 bottom-1 top-4 flex flex-wrap content-center justify-center gap-0.5 px-0.5">
                                        {buEntries.map(([bu, buCount]) => (
                                            <div
                                                key={bu}
                                                className={`${getBUColor(bu)} rounded-full w-3.5 h-3.5 flex items-center justify-center text-white font-bold text-[7px] shadow-sm`}
                                                title={`${buCount} ${bu}`}
                                            >
                                                {buCount}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
