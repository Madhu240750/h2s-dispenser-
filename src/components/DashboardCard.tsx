import React from 'react';
import { LucideIcon, Activity } from 'lucide-react';

interface DashboardCardProps {
  id?: string;
  title: string;
  value: string;
  subtext?: string;
  icon?: LucideIcon;
  colorClass?: string;
  status?: 'normal' | 'warning' | 'danger' | 'neutral';
  badge?: {
    text: string;
    variant: 'neutral' | 'success' | 'warning' | 'danger';
  };
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  status,
  badge,
}) => {
  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  // Derive color class from status if colorClass is not passed
  let resolvedColorClass = colorClass;
  if (!resolvedColorClass) {
    if (status === 'danger') resolvedColorClass = 'bg-rose-100 text-rose-700';
    else if (status === 'warning') resolvedColorClass = 'bg-amber-100 text-amber-700';
    else if (status === 'normal') resolvedColorClass = 'bg-emerald-100 text-emerald-700';
    else resolvedColorClass = 'bg-blue-100 text-blue-700';
  }

  // Fallback icon if none provided
  const RenderIcon = Icon || Activity;

  return (
    <div id={id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 transition-all hover:shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
            {badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${badgeStyles[badge.variant]}`}>
                {badge.text}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold mt-1.5 text-slate-800 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${resolvedColorClass}`}>
          <RenderIcon size={20} />
        </div>
      </div>
    </div>
  );
};
