import React, { useState } from 'react';
import { DiaryView } from './diary/DiaryView';
import { ExperimentsView } from './diary/ExperimentsView';
import { BookOpen, FlaskConical } from 'lucide-react';

export const DiarioBordo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'diario' | 'experimentos'>('diario');

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-4">
        <button
          onClick={() => setActiveTab('diario')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'diario'
            ? 'border-blue-500 text-blue-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <BookOpen size={18} />
          <span className="font-medium">Diário de Bordo</span>
        </button>
        <button
          onClick={() => setActiveTab('experimentos')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'experimentos'
            ? 'border-purple-500 text-purple-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <FlaskConical size={18} />
          <span className="font-medium">Gestor de Experimentos</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        {activeTab === 'diario' ? <DiaryView /> : <ExperimentsView />}
      </div>
    </div>
  );
};
