import { useMemo } from 'react';
import { CalendarData, FilterState } from '../types/framework';

export const useAdvancedFilters = (data: CalendarData, filters: FilterState) => {
  const filteredData = useMemo(() => {
    try {
      const result: CalendarData = {};

      Object.entries(data).forEach(([dateKey, activities]) => {
        const filtered = activities.filter(activity => {
          // Filtro por BU
          if (filters.bu.length > 0 && !filters.bu.includes(activity.bu)) {
            return false;
          }

          // Filtro por Canal
          if (filters.canais.length > 0 && !filters.canais.includes(activity.canal)) {
            return false;
          }

          // Filtro por Segmento
          if (filters.segmentos.length > 0 && !filters.segmentos.includes(activity.segmento)) {
            return false;
          }

          // Filtro por Parceiro
          if (filters.parceiros.length > 0 && !filters.parceiros.includes(activity.parceiro)) {
            return false;
          }

          // Filtro por Data (Período)
          if (filters.dataInicio) {
            const [y, m, d] = filters.dataInicio.split('-').map(Number);
            const startDate = new Date(y, m - 1, d);
            // Reset hours to ensure fair comparison
            startDate.setHours(0, 0, 0, 0);
            const activityDate = new Date(activity.dataDisparo);
            activityDate.setHours(0, 0, 0, 0);

            if (activityDate < startDate) return false;
          }

          if (filters.dataFim) {
            const [y, m, d] = filters.dataFim.split('-').map(Number);
            const endDate = new Date(y, m - 1, d);
            endDate.setHours(23, 59, 59, 999); // End of day
            const activityDate = new Date(activity.dataDisparo);
            activityDate.setHours(0, 0, 0, 0);

            if (activityDate > endDate) return false;
          }

          return true;
        });

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

  // Calcula contadores para exibir no sidebar
  const availableCanais = useMemo(() => {
    const canais = new Set<string>();
    Object.values(data).forEach(activities => {
      activities.forEach(activity => {
        if (activity.canal) {
          canais.add(activity.canal);
        }
      });
    });
    return Array.from(canais).sort();
  }, [data]);

  const availableSegmentos = useMemo(() => {
    const segmentos = new Set<string>();
    Object.values(data).forEach(activities => {
      activities.forEach(activity => {
        if (activity.segmento) {
          segmentos.add(activity.segmento);
        }
      });
    });
    return Array.from(segmentos).sort();
  }, [data]);

  // Conta atividades por canal/segmento
  const countByCanal = useMemo(() => {
    const counts: { [canal: string]: number } = {};
    Object.values(filteredData).forEach(activities => {
      activities.forEach(activity => {
        counts[activity.canal] = (counts[activity.canal] || 0) + 1;
      });
    });
    return counts;
  }, [filteredData]);

  const countBySegmento = useMemo(() => {
    const counts: { [segmento: string]: number } = {};
    Object.values(filteredData).forEach(activities => {
      activities.forEach(activity => {
        counts[activity.segmento] = (counts[activity.segmento] || 0) + 1;
      });
    });
    return counts;
  }, [filteredData]);

  const availableParceiros = useMemo(() => {
    const parceiros = new Set<string>();
    Object.values(data).forEach(activities => {
      activities.forEach(activity => {
        if (activity.parceiro) {
          parceiros.add(activity.parceiro);
        }
      });
    });
    return Array.from(parceiros).sort();
  }, [data]);

  const countByParceiro = useMemo(() => {
    const counts: { [parceiro: string]: number } = {};
    Object.values(filteredData).forEach(activities => {
      activities.forEach(activity => {
        counts[activity.parceiro] = (counts[activity.parceiro] || 0) + 1;
      });
    });
    return counts;
  }, [filteredData]);

  return {
    filteredData,
    availableCanais,
    availableSegmentos,
    availableParceiros,
    countByCanal,
    countBySegmento,
    countByParceiro
  };
};
