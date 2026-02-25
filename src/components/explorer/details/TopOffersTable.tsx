import React from 'react';
import { TopOfferItem } from '../../../types/explorer';

interface TopOffersTableProps {
  items: TopOfferItem[];
}

export const TopOffersTable: React.FC<TopOffersTableProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Ofertas</p>
        <p className="text-slate-500 text-xs">Sem dados de oferta</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Ofertas</p>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div key={item.oferta} className="flex items-center gap-2 text-xs py-1 border-b border-slate-700/50 last:border-0">
            <span className="text-slate-500 tabular-nums font-mono w-4">{i + 1}.</span>
            <span className="text-slate-300 truncate flex-1" title={item.oferta}>
              {item.oferta.length > 22 ? item.oferta.slice(0, 22) + '…' : item.oferta}
            </span>
            <span className="text-white font-mono tabular-nums">
              {item.cartoes >= 1000
                ? `${(item.cartoes / 1000).toFixed(1)}k`
                : item.cartoes}{' '}
              <span className="text-slate-500">cartões</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
