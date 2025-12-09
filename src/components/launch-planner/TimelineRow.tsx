import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { format, isSameDay } from 'date-fns';
import { Activity } from '../../types/framework';
import { Clock } from 'lucide-react';

interface TimelineRowProps {
    rowId: string;
    title: string;
    days: Date[];
    activities: Activity[];
    onActivityClick?: (activity: Activity) => void;
}

export const TimelineRow: React.FC<TimelineRowProps> = ({ rowId, title, days, activities, onActivityClick }) => {
    return (
        <div className="flex border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
            {/* Row Header (Channel Name) */}
            <div className="w-48 shrink-0 p-3 border-r border-slate-800 flex items-center font-medium text-slate-300 text-sm bg-slate-900/50 sticky left-0 z-20">
                {title}
            </div>

            {/* Row Days */}
            <div className="flex-1 flex">
                {days.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const droppableId = `${rowId}::${dateKey}`;
                    const dayActivities = activities.filter(a => isSameDay(a.dataDisparo, day));
                    const isToday = isSameDay(day, new Date());

                    return (
                        <Droppable key={droppableId} droppableId={droppableId}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`
                                        min-w-[120px] p-2 border-r border-slate-800/50 flex flex-col gap-1 transition-colors
                                        ${snapshot.isDraggingOver ? 'bg-blue-900/20' : ''}
                                        ${isToday ? 'bg-blue-900/5' : ''}
                                    `}
                                >
                                    {dayActivities.map((activity, index) => (
                                        <Draggable key={activity.id} draggableId={activity.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => onActivityClick?.(activity)}
                                                    className={`
                                                        p-1.5 rounded text-xs font-medium text-white shadow-sm cursor-pointer
                                                        flex items-center gap-1.5 overflow-hidden
                                                        ${snapshot.isDragging ? 'z-50 ring-2 ring-white scale-105' : ''}
                                                        bg-blue-600 hover:bg-blue-500 transition-all
                                                    `}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                    }}
                                                >
                                                    <Clock size={10} className="shrink-0" />
                                                    <span className="truncate">{activity.id}</span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    );
                })}
            </div>
        </div>
    );
};
