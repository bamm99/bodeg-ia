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

  let barBg = 'var(--accent)';
  if (isLimit100) {
    barBg = 'var(--danger)';
  } else if (isWarning90) {
    barBg = 'var(--warning)';
  }

  const renderIcon = () => {
    switch (iconType) {
      case 'users':
        return <Users size={16} color="var(--primary)" />;
      case 'storage':
        return <Database size={16} color="var(--secondary)" />;
      default:
        return <Building2 size={16} color="var(--accent)" />;
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {renderIcon()}
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isWarning90 && (
            <span className={isLimit100 ? 'badge badge-danger' : 'badge badge-warning'}>
              <AlertTriangle size={12} />
              {isLimit100 ? '100% Alcanzado' : '90% Capacidad'}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
            {current} / {max} {unit}
          </span>
        </div>
      </div>

      {/* Track */}
      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: barBg,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {percent}% utilizado
      </div>
    </div>
  );
};
