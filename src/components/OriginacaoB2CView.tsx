import React, { useState } from 'react';
import { useB2CAnalysis } from '../hooks/useB2CAnalysis';
import { useAppStore } from '../store/useAppStore';
import { OriginacaoKPIsComparison } from './originacao/OriginacaoKPIsComparison';
import { OriginacaoKPIsPerformance } from './originacao/OriginacaoKPIsPerformance';
import { OriginacaoCharts } from './originacao/OriginacaoCharts';
import { OriginacaoTable } from './originacao/OriginacaoTable';
import { B2CUpload } from './originacao/B2CUpload';
import { ActivityShareCorrelationChart } from './originacao/ActivityShareCorrelationChart';
import { ShareBySegmentChart } from './originacao/ShareBySegmentChart';
import { BarChart3 } from 'lucide-react';
import { DailyDetailsModal } from './jornada/DailyDetailsModal';
import { Activity } from '../types/framework';
import { format } from 'date-fns';

export const OriginacaoB2CView: React.FC = () => {
    const { dailyAnalysis, summary, previousSummary, viewMode, setViewMode, getActivities, segmentStats } = useB2CAnalysis();
    const { alertConfig, b2cData } = useAppStore();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);

    const handleDayClick = (dateStr: string) => {
        const activities = getActivities(dateStr, 'daily');
        const [y, m, d] = dateStr.split('-').map(Number);

        setModalDate(new Date(y, m - 1, d));
        setSelectedActivities(activities);
        setModalTitle(undefined); // Use default
        setModalOpen(true);
    };

    const handleWeekClick = (weekStartStr: string) => {
        const activities = getActivities(weekStartStr, 'weekly');
        const [y, m, d] = weekStartStr.split('-').map(Number);
        const startDate = new Date(y, m - 1, d);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        setModalDate(startDate);
        setSelectedActivities(activities);
        setModalTitle(`📅 Detalhes da Semana: ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedActivities([]);
        setModalDate(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <BarChart3 className="text-blue-500" />
                        Originação B2C
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Análise de participação CRM na originação total B2C.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Only show upload if no data loaded globally */}
                    {b2cData.length === 0 && <B2CUpload />}
                </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
                <div className="max-w-[1600px] mx-auto">
                    {dailyAnalysis.length > 0 && summary ? (
                        <>

                            {/* ROW 1: Comparison Cards (Left 2/3) + Segment Pie (Right 1/3) */}
                            <div className="flex flex-col xl:flex-row gap-6 mb-8">
                                <div className="xl:w-7/12">
                                    <h3 className="text-lg font-bold text-slate-100 mb-4 opacity-90">Comparação B2C vs CRM</h3>
                                    <OriginacaoKPIsComparison summary={summary} previousSummary={previousSummary} />
                                </div>
                                <div className="xl:w-5/12 flex flex-col">
                                    <ShareBySegmentChart
                                        segmentStats={segmentStats}
                                        totalB2CEmissoes={summary.emissoes_b2c_total}
                                    />
                                </div>
                            </div>

                            {/* ROW 2: Performance KPIs */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-slate-100 mb-4 opacity-90">Performance</h3>
                                <OriginacaoKPIsPerformance summary={summary} />
                            </div>

                            <OriginacaoCharts
                                data={dailyAnalysis}
                                shareThreshold={alertConfig.share_crm_limiar}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                            />
                            <OriginacaoTable
                                data={dailyAnalysis}
                                onRowClick={handleDayClick}
                            />
                            <div className="mb-6">
                                <ActivityShareCorrelationChart
                                    data={dailyAnalysis}
                                    onBarClick={handleWeekClick}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                            <p className="text-slate-500 mb-2">Nenhum dado B2C carregado.</p>
                            <p className="text-xs text-slate-600">Faça upload do CSV diarizado para começar.</p>
                        </div>
                    )}
                </div>

                {modalOpen && (
                    <DailyDetailsModal
                        date={modalDate}
                        activities={selectedActivities}
                        onClose={handleCloseModal}
                        titleOverride={modalTitle}
                    />
                )}
            </div>
        </div>
    );
};
