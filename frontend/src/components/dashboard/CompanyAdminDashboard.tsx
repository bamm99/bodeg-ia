import React from 'react';
import { Building2, Warehouse, Layers, Activity, ArrowDownRight, ArrowUpRight, FileText, Users, AlertTriangle } from 'lucide-react';

interface CompanyAdminDashboardProps {
  data: any;
  loading: boolean;
  user: any;
  onNavigate: (section: string) => void;
}

export const CompanyAdminDashboard: React.FC<CompanyAdminDashboardProps> = ({ data, loading, user, onNavigate }) => {
  const planName = data?.stats?.planName || 'PRO';
  const warehousesCount = data?.stats?.totalWarehousesCount || 2;
  const maxWarehouses = data?.stats?.maxWarehouses || 5;
  const storageM3 = data?.stats?.totalStorageM3 || 480.0;
  const maxStorageM3 = data?.stats?.maxStorageM3 || 1000.0;
  const occupiedM3 = data?.stats?.totalOccupiedM3 || 180.5;

  const storagePct = Math.round((occupiedM3 / maxStorageM3) * 100);
  const isNearLimit = storagePct >= 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success">
              <Building2 size={12} /> EMPRESA REGISTRADA
            </span>
            <span className="badge badge-primary">Plan {planName}</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            Panel Principal <span className="gradient-text">{user?.company?.name || 'Mi Empresa'}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Gestión integral de sucursales, instalaciones de bodega, inventario y facturación de servicios 3PL.
          </p>
        </div>

        {/* Quick Operational Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('inbound')} className="btn btn-primary" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
            <ArrowDownRight size={16} />
            <span>Recepción (Inbound)</span>
          </button>
          <button onClick={() => onNavigate('outbound')} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
            <ArrowUpRight size={16} />
            <span>Despacho (Outbound)</span>
          </button>
          <button onClick={() => onNavigate('dispatch-requests')} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
            <FileText size={16} />
            <span>Solicitudes 3PL</span>
          </button>
        </div>
      </div>

      {/* Near limit alert if applicable */}
      {isNearLimit && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid #f59e0b',
            color: '#fcd34d',
            padding: '16px 20px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <div>
              <strong>Alerta de Capacidad:</strong> Has consumido el {storagePct}% de la capacidad contratada en tu Plan {planName}.
            </div>
          </div>
          <button onClick={() => onNavigate('settings')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#f59e0b', border: 'none', color: '#000' }}>
            Solicitar Upgrade
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Bodegas Activas</span>
            <Warehouse size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : `${warehousesCount} / ${maxWarehouses}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Instalaciones configuradas</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Capacidad Total (m³)</span>
            <Layers size={20} color="var(--secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : `${storageM3} m³`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Límite Máximo: {maxStorageM3} m³</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Volumen Ocupado</span>
            <Activity size={20} color={isNearLimit ? '#f59e0b' : 'var(--accent)'} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isNearLimit ? '#f59e0b' : 'var(--primary)' }}>
            {loading ? '...' : `${occupiedM3} m³`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ocupación: {storagePct}%</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Suscripción SaaS</span>
            <Building2 size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            Plan {planName}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Empresa Verificada</div>
        </div>
      </div>

      {/* Grid of Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={18} color="var(--primary)" />
            Infraestructura & Espacios
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Diseña el plano 2D, agrega repisas, niveles y administra los casilleros de almacenamiento.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onNavigate('map2d')} className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
              Plano 2D Interactivo
            </button>
            <button onClick={() => onNavigate('spatial')} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
              Diseñador Espacial
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--secondary)" />
            Servicios 3PL a Terceros
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Administra tus clientes 3PL, revisa solicitudes de despacho y cotiza servicios de almacenaje.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onNavigate('clients')} className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
              Clientes 3PL
            </button>
            <button onClick={() => onNavigate('cost-simulator')} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
              Simulador de Cobros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
