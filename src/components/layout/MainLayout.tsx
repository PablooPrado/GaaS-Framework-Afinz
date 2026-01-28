import React, { ReactNode } from 'react';
import { GlobalHeader } from './GlobalHeader';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-[#1A2238] text-slate-100 font-sans selection:bg-blue-500/30">

            {/* 1. Global App Header (Logo, Search, User, Nav) */}
            <GlobalHeader />

            {/* 2. Main Content Area (Full Width) */}
            <main className="flex-1 flex flex-col relative w-full max-w-[1920px] mx-auto pt-16">
                <div className="flex-1 p-2 w-full h-full overflow-y-auto overflow-x-hidden">
                    {children}
                </div>
            </main>

        </div>
    );
};
