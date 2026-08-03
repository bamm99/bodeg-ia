import React from 'react';
import { AlertTriangle, Database, Building2, Users } from 'lucide-react';

export interface PlanUsageBarProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  iconType?: 'warehouse' | 'users' | 'storage';
}

export const PlanUsageBar: React.FC<PlanUsageBarProps> = ({
  label,
  current,
  max,
  unit = '',
  iconType = 'warehouse',
}) => {
  const percent = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;
  const isWarning90 = percent >= 90;
  const isLimit100 = percent >= 100;

  let barColorClass = 'bg-emerald-500';
  if (isLimit100) {
    barColorClass = 'bg-rose-500';
  } else if (isWarning90) {
    barColorClass = 'bg-amber-500';
  }

  const renderIcon = () => {
    switch (iconType) {
      case 'users':
        return <Users className="w-4 h-4 text-slate-400" />;
      case 'storage':
        return <Database className="w-4 h-4 text-slate-400" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <span className="font-semibold text-slate-300">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          {isWarning90 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              {isLimit100 ? '100% Alcanzado' : '90% Capacidad'}
            </span>
          )}
          <span className="font-mono text-slate-200">
            {current} / {max} {unit}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-end text-[10px] text-slate-500 font-mono">
        {percent}% utilizado
      </div>
    </div>
  );
};
