import React from 'react';
import type { WizardBU } from '../types';

interface Step1BUProps {
  onSelect: (bu: WizardBU) => void;
}

const BU_CARDS: { bu: WizardBU; label: string; description: string; color: string; ring: string; dot: string }[] = [
  {
    bu: 'B2C',
    label: 'B2C',
    description: 'Aquisição direta ao consumidor final',
    color: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
    ring: 'hover:ring-blue-400',
    dot: 'bg-blue-500',
  },
  {
    bu: 'B2B2C',
    label: 'B2B2C',
    description: 'Parceiros e canais indiretos',
    color: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100',
    ring: 'hover:ring-emerald-400',
    dot: 'bg-emerald-500',
  },
  {
    bu: 'Plurix',
    label: 'Plurix',
    description: 'Canal Plurix e Funcionários',
    color: 'border-purple-300 bg-purple-50 hover:bg-purple-100',
    ring: 'hover:ring-purple-400',
    dot: 'bg-purple-500',
  },
  {
    bu: 'Seguros',
    label: 'Seguros',
    description: 'Produtos e campanhas de seguros',
    color: 'border-orange-300 bg-orange-50 hover:bg-orange-100',
    ring: 'hover:ring-orange-400',
    dot: 'bg-orange-500',
  },
];

export const Step1BU: React.FC<Step1BUProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-800">Qual BU você vai trabalhar?</h2>
        <p className="text-sm text-slate-500 mt-1">Selecione para começar a jornada</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {BU_CARDS.map((card, i) => (
          <button
            key={card.bu}
            onClick={() => onSelect(card.bu)}
            className={`
              flex flex-col items-center gap-2 p-5 rounded-xl border-2
              transition-all duration-200 cursor-pointer
              hover:ring-2 hover:ring-offset-1 hover:scale-[1.03]
              ${card.color} ${card.ring}
            `}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-3 h-3 rounded-full ${card.dot}`} />
            <span className="text-base font-bold text-slate-800">{card.label}</span>
            <span className="text-[11px] text-slate-500 text-center leading-tight">{card.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
