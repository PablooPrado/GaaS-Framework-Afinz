import React from 'react';
import { useFilters } from '../../context/FilterContext';
import { CampaignPerformanceTable } from '../CampaignPerformanceTable';

export const CampaignDetailsTab: React.FC = () => {
    const { filteredData } = useFilters();

    return (
        <div className="animate-fade-in">
            <CampaignPerformanceTable data={filteredData} />
        </div>
    );
};
