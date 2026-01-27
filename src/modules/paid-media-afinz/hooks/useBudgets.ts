import { useState, useEffect } from 'react';
import { getBudgets, saveBudget, updateBudget, deleteBudget } from '../utils/budgetsManager';
import type { Budget } from '../utils/budgetsManager';

export const useBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);

    const load = () => {
        setBudgets(getBudgets());
    };

    useEffect(() => {
        load();
    }, []);

    const add = (b: Omit<Budget, 'id'>) => {
        saveBudget(b);
        load();
    };

    const update = (id: string, b: Partial<Budget>) => {
        updateBudget(id, b);
        load();
    };

    const remove = (id: string) => {
        deleteBudget(id);
        load();
    };

    return { budgets, add, update, remove, refresh: load };
};
