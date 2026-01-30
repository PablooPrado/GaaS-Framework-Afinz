import React, { useState } from 'react';
import { CalendarData, FilterState, Activity } from '../../types/framework';
import { DashboardLayout } from './DashboardLayout';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';
import { ProgramarDisparoModal } from '../dispatch/ProgramarDisparoModal';
import { useAdvancedFilters } from '../../hooks/useAdvancedFilters';
import { useAppStore } from '../../store/useAppStore';
import { ActivityRow } from '../../types/activity';
import { isSameDay, format } from 'date-fns';
import { mapSqlToActivity } from '../../services/dataService';


interface LaunchPlannerProps {
    data: CalendarData;
    onActivityUpdate?: (activityId: string, newDate: Date) => void;
}

export const LaunchPlanner: React.FC<LaunchPlannerProps> = ({ data, onActivityUpdate }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ActivityRow | null>(null);

    // Get global filters from store
    const viewSettings = useAppStore((state) => state.viewSettings);
    const addActivity = useAppStore((state) => state.addActivity); // Action to update store
    const filters: FilterState = viewSettings.filtrosGlobais;

    // Get available segmentos and determine active one
    const { availableSegmentos } = useAdvancedFilters(data, filters);
    const activeSegmento = filters.segmentos[0] || availableSegmentos[0] || 'Todos';

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
    };

    const handleEditActivity = (activity: Activity) => {
        // Map Activity/FrameworkRow back to ActivityRow for the modal
        // We use the raw data from the activity
        const activityRow: ActivityRow = {
            ...activity.raw,
            id: activity.raw.id || activity.id,
            BU: activity.bu,
            jornada: activity.jornada,
            'Activity name / Taxonomia': activity.id,
            'Data de Disparo': format(activity.dataDisparo, 'yyyy-MM-dd'),
            status: activity.status || 'Scheduled'
        } as any;

        setEditingActivity(activityRow);
        setIsModalOpen(true);
        setSelectedDate(null);
    };

    const getActivitiesForDate = (date: Date) => {
        return Object.values(data).flat().filter(a => isSameDay(a.dataDisparo, date));
    };

    // Dispatch handlers
    const handleSaveActivity = async (activity: ActivityRow) => {
        // Update Global Store immediately to reflect in Calendar
        // Map DB Row (ActivityRow) to App Entity (Activity)
        const mappedActivity = mapSqlToActivity(activity);
        addActivity(mappedActivity);

        if (onActivityUpdate) {
            onActivityUpdate(activity.id, new Date(activity['Data de Disparo']));
        }
        setIsModalOpen(false);
        setEditingActivity(null);
    };

    return (
        <>
            <DashboardLayout
                data={data}
                onActivityUpdate={onActivityUpdate}
                onDayClick={handleDayClick}
                onProgramDispatch={() => {
                    setEditingActivity(null);
                    setIsModalOpen(true);
                }}
            />

            {selectedDate && (
                <DailyDetailsModal
                    date={selectedDate}
                    activities={getActivitiesForDate(selectedDate)}
                    onClose={() => setSelectedDate(null)}
                    onEdit={handleEditActivity}
                />
            )}

            {/* Modal de Programar Atividade */}
            <ProgramarDisparoModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingActivity(null);
                }}
                onSuccess={handleSaveActivity}
                editingActivity={editingActivity}
                activeSegmento={activeSegmento}
            />
        </>
    );
};
