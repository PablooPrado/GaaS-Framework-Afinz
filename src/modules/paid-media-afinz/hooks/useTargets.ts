import { useState, useEffect } from 'react';
import { getTargets, saveTarget, updateTarget, deleteTarget } from '../utils/targetsManager';
import type { Target } from '../utils/targetsManager';

export const useTargets = () => {
    const [targets, setTargets] = useState<Target[]>([]);

    const load = () => {
        setTargets(getTargets());
    };

    useEffect(() => {
        load();
    }, []);

    const add = (t: Omit<Target, 'id'>) => {
        saveTarget(t);
        load();
    };

    const update = (id: string, t: Partial<Target>) => {
        updateTarget(id, t);
        load();
    };

    const remove = (id: string) => {
        deleteTarget(id);
        load();
    };

    return { targets, add, update, remove, refresh: load };
};
