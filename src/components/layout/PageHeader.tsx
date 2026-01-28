import React from 'react';
import { PeriodSelector } from '../period-selector/PeriodSelector';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
            <div>
                <h2 className="text-xl font-bold text-slate-100">{title}</h2>
                <div className="mt-1">
                    <PeriodSelector />
                </div>
            </div>
            <div className="flex items-center gap-3">
                {children}
            </div>
        </div>
    );
};
