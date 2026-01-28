import React, { useMemo, useEffect } from 'react';
import { CalendarData } from '../../types/framework';
import { CalendarSummary } from './CalendarSummary';
import { KPIOverview } from './KPIOverview';
import { LaunchPlannerKPIs } from './LaunchPlannerKPIs';
import { useAppStore } from '../../store/useAppStore';
import { usePeriod } from '../../contexts/PeriodContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { differenceInDays, subDays, isWithinInterval } from 'date-fns';
import { Send } from 'lucide-react';

interface DashboardLayoutProps {
    data: CalendarData;
    onActivityUpdate?: (activityId: string, newDate: Date) => void;
    onDayClick?: (date: Date) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ data, onDayClick }) => {
    const [displayDate, setDisplayDate] = React.useState(new Date());
    const { goals, b2cData } = useAppStore();
    const { startDate, endDate, compareEnabled, setPeriod } = usePeriod();

    // Sync displayDate with endDate (focus on the "target" or "current" end of the range)
    useEffect(() => {
        if (endDate && format(endDate, 'yyyy-MM') !== format(displayDate, 'yyyy-MM')) {
            setDisplayDate(endDate);
        }
    }, [endDate]);

    // Handle month change from Calendar
    const handleMonthChange = (newDate: Date) => {
        setDisplayDate(newDate);
        // Update global period context to the new month
        setPeriod(startOfMonth(newDate), endOfMonth(newDate), 'custom');
    };

    // Flatten data
    const allActivities = useMemo(() => Object.values(data).flat(), [data]);

    // Filter for Current Period (from Context)
    const currentPeriodActivities = useMemo(() => {
        return allActivities.filter(a =>
            isWithinInterval(a.dataDisparo, { start: startDate, end: endDate })
        );
    }, [allActivities, startDate, endDate]);

    // Filter B2C Data for Current Period
    const currentB2CData = useMemo(() => {
        return b2cData.filter(d =>
            isWithinInterval(new Date(d.data), { start: startDate, end: endDate })
        );
    }, [b2cData, startDate, endDate]);

    // Filter for Previous Period (Comparison)
    const previousPeriodActivities = useMemo(() => {
        if (!compareEnabled) return [];

        const duration = differenceInDays(endDate, startDate) + 1;
        const prevStart = subDays(startDate, duration);
        const prevEnd = subDays(endDate, duration);

        return allActivities.filter(a =>
            isWithinInterval(a.dataDisparo, { start: prevStart, end: prevEnd })
        );
    }, [allActivities, startDate, endDate, compareEnabled]);

    return (
        <div className="flex h-full gap-2 p-2 bg-[#0F172A] overflow-hidden">
            {/* Left Column: Calendar Summary */}
            <div className="w-1/3 min-w-[320px] flex flex-col gap-2">
                <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                    <CalendarSummary
                        data={data}
                        onDayClick={onDayClick}
                        displayDate={displayDate}
                        onMonthChange={handleMonthChange}
                    />
                </div>

                {/* Programar Disparo Button */}
                <button className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium flex items-center justify-center gap-2 transition-colors text-sm">
                    <Send size={16} />
                    Programar disparo
                </button>
            </div>

            {/* Right Column: KPIs & Goals Preview */}
            <div className="flex-1 flex flex-col overflow-y-auto pr-1 gap-3">
                {/* Detailed KPIs Grid */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex justify-between items-center">
                        <span>KPIs</span>
                        {compareEnabled && (
                            <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                                Comparando com período anterior
                            </span>
                        )}
                    </h3>
                    <KPIOverview
                        activities={currentPeriodActivities}
                        previousActivities={previousPeriodActivities}
                        b2cData={currentB2CData}
                    />
                </div>

                {/* Goals Preview (Replacing Funnel) */}
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-2">
                        <span>🎯</span> Metas & Resultados
                    </h3>
                    <LaunchPlannerKPIs
                        activities={currentPeriodActivities}
                        goals={goals}
                        currentMonth={format(startDate, 'yyyy-MM')}
                    />
                </div >
            </div >
        </div >
    );
};
