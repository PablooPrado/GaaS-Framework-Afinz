import React from 'react';
import { PeriodSelector } from '../period-selector/PeriodSelector';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
    return (
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#00C6CC] sticky top-0 z-20 shadow-lg">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 drop-shadow-sm">{title}</h2>
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
