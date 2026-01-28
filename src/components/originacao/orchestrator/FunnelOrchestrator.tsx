import React, { useState } from 'react';
import { Filter, Layers, BarChart3, Calculator, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components (will be created next)
import { OrchestratorFilters } from './OrchestratorFilters';
import { FunnelLayers } from './FunnelLayers';
import { InfluenceMatrix } from './InfluenceMatrix';
import { ResultEstimates } from './ResultEstimates';
import { ActionLevers } from './ActionLevers';

export const FunnelOrchestrator: React.FC = () => {
    const [activeView, setActiveView] = useState<'funnel' | 'matrix' | 'estimates'>('funnel');

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-yellow-500" />
                        Orquestrador de Funil
                    </h2>
                    <p className="text-sm text-slate-400">
                        Análise integrada de mídia, conversão e influência para maximizar emissão de cartões.
                    </p>
                </div>

                {/* View Toggles */}
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                        onClick={() => setActiveView('funnel')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'funnel' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <Layers size={16} />
                        Funil Visual
                    </button>
                    <button
                        onClick={() => setActiveView('matrix')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'matrix' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <BarChart3 size={16} />
                        Matriz de Influência
                    </button>
                    <button
                        onClick={() => setActiveView('estimates')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'estimates' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <Calculator size={16} />
                        Estimativas
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="border-t border-slate-800 pt-4">
                <OrchestratorFilters />
            </div>

            {/* Main Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeView === 'funnel' && (
                        <motion.div
                            key="funnel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <FunnelLayers />
                        </motion.div>
                    )}

                    {activeView === 'matrix' && (
                        <motion.div
                            key="matrix"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <InfluenceMatrix />
                        </motion.div>
                    )}

                    {activeView === 'estimates' && (
                        <motion.div
                            key="estimates"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <ResultEstimates />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Levers (Always Visible or Conditional?) */}
            <div className="border-t border-slate-800 pt-6">
                <h3 className="text-lg font-bold text-white mb-4">Alavancas de Ação</h3>
                <ActionLevers />
            </div>
        </div>
    );
};
