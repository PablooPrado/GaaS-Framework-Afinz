import { useState, useEffect } from 'react';
import { Goal } from '../types/framework';

const STORAGE_KEY = 'calendar-goals';

export const useGoals = () => {
    const [goals, setGoals] = useState<{ [key: string]: Goal }>({});

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setGoals(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse goals from localStorage', e);
            }
        }
    }, []);

    const saveGoal = (goal: Goal) => {
        const newGoals = { ...goals, [goal.mes]: goal };
        setGoals(newGoals);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
    };

    const getGoal = (month: string) => {
        return goals[month] || { mes: month, cartoes_meta: 0, aprovacoes_meta: 0, cac_max: 0 };
    };

    return {
        goals,
        saveGoal,
        getGoal
    };
};
