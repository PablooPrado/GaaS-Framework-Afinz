import React from 'react';

interface TreeNodeBadgeProps {
  count: number;
}

export const TreeNodeBadge: React.FC<TreeNodeBadgeProps> = ({ count }) => (
  <span className="ml-auto text-xs font-mono text-slate-500 tabular-nums shrink-0">
    {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
  </span>
);
