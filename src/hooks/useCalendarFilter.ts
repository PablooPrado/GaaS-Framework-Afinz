import { useMemo } from 'react';
import { CalendarData, FilterState } from '../types/framework';

export const useCalendarFilter = (data: CalendarData, filters: FilterState) => {
  const filteredData = useMemo(() => {
    // If no BU selected, show nothing? Or show all? 
    // Usually if nothing selected, show nothing.
    // But if filters.bu is empty, maybe we should treat as "all"?
    // The previous logic was: if (selectedBUs.length === 0) return {};
    if (filters.bu.length === 0) return {};

    const filtered: CalendarData = {};

    Object.entries(data).forEach(([dateKey, activities]) => {
      const filtered_activities = activities.filter(activity => filters.bu.includes(activity.bu));
      if (filtered_activities.length > 0) {
        filtered[dateKey] = filtered_activities;
      }
    });

    return filtered;
  }, [data, filters.bu]);

  const activityCountByDay = useMemo(() => {
    const counts: { [dateKey: string]: number } = {};
    Object.entries(filteredData).forEach(([dateKey, activities]) => {
      counts[dateKey] = activities.length;
    });
    return counts;
  }, [filteredData]);

  const getDominantBU = (dateKey: string): string | null => {
    const activities = filteredData[dateKey] || [];
    if (activities.length === 0) return null;

    const buCounts: { [key: string]: number } = {};
    activities.forEach(activity => {
      buCounts[activity.bu] = (buCounts[activity.bu] || 0) + 1;
    });

    return Object.entries(buCounts).sort(([, a], [, b]) => b - a)[0][0];
  };

  const getTotalActivities = useMemo(() => {
    return Object.values(filteredData).reduce((sum, activities) => sum + activities.length, 0);
  }, [filteredData]);

  return {
    filteredData,
    activityCountByDay,
    getDominantBU,
    getTotalActivities,
    selectedBUs: filters.bu
  };
};
