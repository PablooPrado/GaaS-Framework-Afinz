import { useMemo } from 'react';
import { CalendarData, FilterState, Activity } from '../types/framework';

type FilterKey = 'canais' | 'jornadas' | 'segmentos' | 'parceiros';

const normalizeDayStart = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const normalizeDayEnd = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const parseISODate = (value?: string) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

export const useAdvancedFilters = (data: CalendarData, filters: FilterState) => {
  const allActivities = useMemo(() => Object.values(data).flat(), [data]);

  const matchActivity = (activity: Activity, omit: FilterKey[] = []) => {
    if (!omit.includes('canais') && filters.canais.length > 0 && !filters.canais.includes(activity.canal)) {
      return false;
    }

    if (!omit.includes('jornadas') && filters.jornadas.length > 0 && !filters.jornadas.includes(activity.jornada)) {
      return false;
    }

    if (!omit.includes('segmentos') && filters.segmentos.length > 0 && !filters.segmentos.includes(activity.segmento)) {
      return false;
    }

    if (!omit.includes('parceiros') && filters.parceiros.length > 0 && !filters.parceiros.includes(activity.parceiro)) {
      return false;
    }

    if (filters.bu.length > 0 && !filters.bu.includes(activity.bu)) {
      return false;
    }

    const startDate = parseISODate(filters.dataInicio);
    if (startDate) {
      const activityDate = normalizeDayStart(new Date(activity.dataDisparo));
      if (activityDate < normalizeDayStart(startDate)) return false;
    }

    const endDate = parseISODate(filters.dataFim);
    if (endDate) {
      const activityDate = normalizeDayStart(new Date(activity.dataDisparo));
      if (activityDate > normalizeDayEnd(endDate)) return false;
    }

    return true;
  };

  const filteredData = useMemo(() => {
    try {
      const result: CalendarData = {};

      Object.entries(data).forEach(([dateKey, activities]) => {
        const filtered = activities.filter(activity => matchActivity(activity));
        if (filtered.length > 0) {
          result[dateKey] = filtered;
        }
      });

      return result;
    } catch (e) {
      console.error('Error in useAdvancedFilters:', e);
      return data;
    }
  }, [data, filters]);

  const availableCanais = useMemo(() => {
    const canais = new Set<string>();
    allActivities.forEach(activity => {
      if (activity.canal) canais.add(activity.canal);
    });
    return Array.from(canais).sort();
  }, [allActivities]);

  const availableJornadas = useMemo(() => {
    const jornadas = new Set<string>();
    allActivities.forEach(activity => {
      if (activity.jornada) jornadas.add(activity.jornada);
    });
    return Array.from(jornadas).sort();
  }, [allActivities]);

  const availableSegmentos = useMemo(() => {
    const segmentos = new Set<string>();
    allActivities.forEach(activity => {
      if (activity.segmento) segmentos.add(activity.segmento);
    });
    return Array.from(segmentos).sort();
  }, [allActivities]);

  const availableParceiros = useMemo(() => {
    const parceiros = new Set<string>();
    allActivities.forEach(activity => {
      if (activity.parceiro) parceiros.add(activity.parceiro);
    });
    return Array.from(parceiros).sort();
  }, [allActivities]);

  const countByCanal = useMemo(() => {
    const counts: { [canal: string]: number } = {};
    allActivities
      .filter(activity => matchActivity(activity, ['canais']))
      .forEach(activity => {
        counts[activity.canal] = (counts[activity.canal] || 0) + 1;
      });
    return counts;
  }, [allActivities, filters]);

  const countByJornada = useMemo(() => {
    const counts: { [jornada: string]: number } = {};
    allActivities
      .filter(activity => matchActivity(activity, ['jornadas']))
      .forEach(activity => {
        counts[activity.jornada] = (counts[activity.jornada] || 0) + 1;
      });
    return counts;
  }, [allActivities, filters]);

  const countBySegmento = useMemo(() => {
    const counts: { [segmento: string]: number } = {};
    allActivities
      .filter(activity => matchActivity(activity, ['segmentos']))
      .forEach(activity => {
        counts[activity.segmento] = (counts[activity.segmento] || 0) + 1;
      });
    return counts;
  }, [allActivities, filters]);

  const countByParceiro = useMemo(() => {
    const counts: { [parceiro: string]: number } = {};
    allActivities
      .filter(activity => matchActivity(activity, ['parceiros']))
      .forEach(activity => {
        counts[activity.parceiro] = (counts[activity.parceiro] || 0) + 1;
      });
    return counts;
  }, [allActivities, filters]);

  return {
    filteredData,
    availableCanais,
    availableJornadas,
    availableSegmentos,
    availableParceiros,
    countByCanal,
    countByJornada,
    countBySegmento,
    countByParceiro
  };
};
