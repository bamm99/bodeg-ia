import React from 'react';
import { Warehouse, ArrowDownRight, ArrowUpRight, RefreshCw, FileText, Layers3 } from 'lucide-react';

interface WarehouseManagerDashboardProps {
  user: any;
  onNavigate: (section: string) => void;
}

export const WarehouseManagerDashboard: React.FC<WarehouseManagerDashboardProps> = ({ user, onNavigate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-primary">
              <Warehouse size={12} /> JEFE DE BODEGA
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            Supervisión Operativa de Bodega <span className="gradient-text">{user?.fullName || ''}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Control de ocupación m³, aprobación de solicitudes de despacho 3PL y supervisión de existencias.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('dispatch-requests')} className="btn btn-primary" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
            <FileText size={16} />
            <span>Aprobar Solicitudes 3PL</span>
          </button>
          <button onClick={() => onNavigate('map2d')} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
            <Warehouse size={16} />
            <span>Plano 2D Bodega</span>
          </button>
        </div>
      </div>

      {/* Grid Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('inbound')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>Recepción (Inbound)</span>
            <ArrowDownRight size={20} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            Ingresar Stock
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Verificación m³ e Idempotencia</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('relocate')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>Reubicación (Relocate)</span>
            <RefreshCw size={20} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            Mover Mercancía
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supervisión de casilleros</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('outbound')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>Despacho (Outbound)</span>
            <ArrowUpRight size={20} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            Salida de Productos
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Despacho directo o 3PL respaldado</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('inventory')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>Historial Kardex</span>
            <Layers3 size={20} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            Trazabilidad Inmutable
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Movimientos auditables</div>
        </div>
      </div>
    </div>
  );
};
