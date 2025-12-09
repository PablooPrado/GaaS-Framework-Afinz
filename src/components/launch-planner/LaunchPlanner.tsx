import React, { useState } from 'react';
import { CalendarData } from '../../types/framework';
import { DashboardLayout } from './DashboardLayout';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';
import { isSameDay } from 'date-fns';

interface LaunchPlannerProps {
    data: CalendarData;
    onActivityUpdate?: (activityId: string, newDate: Date) => void;
}

export const LaunchPlanner: React.FC<LaunchPlannerProps> = ({ data, onActivityUpdate }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
    };

    const getActivitiesForDate = (date: Date) => {
        return Object.values(data).flat().filter(a => isSameDay(a.dataDisparo, date));
    };

    return (
        <>
            <DashboardLayout
                data={data}
                onActivityUpdate={onActivityUpdate}
                onDayClick={handleDayClick}
            />

            {selectedDate && (
                <DailyDetailsModal
                    date={selectedDate}
                    activities={getActivitiesForDate(selectedDate)}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </>
    );
};
