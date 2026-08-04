import React from 'react';
import { Building2, Warehouse, Layers, Activity, Crown, ArrowUpRight, Plus } from 'lucide-react';

interface SuperAdminDashboardProps {
  data: any;
  loading: boolean;
  onNavigate: (section: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ data, loading, onNavigate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(129, 140, 248, 0.1) 100%)',
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
            <span className="badge badge-primary" style={{ background: '#38bdf8', color: '#070a11', fontWeight: 800 }}>
              <Crown size={12} /> PLATAFORMA SAAS GLOBAL
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            Consola de Administración General <span className="gradient-text">Bodeg-IA</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Supervisión global de empresas clientes, infraestructura de bodegas, planes contratados e indicadores de red.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate('companies')} className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Plus size={16} />
            <span>Gestionar Empresas</span>
          </button>
          <button onClick={() => onNavigate('plans')} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Crown size={16} />
            <span>Planes & Cuotas</span>
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Empresas Registradas</span>
            <Building2 size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : data?.stats?.totalCompaniesCount || 5}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Empresas SaaS Activas en Red</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Bodegas Totales</span>
            <Warehouse size={20} color="var(--secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : data?.stats?.totalWarehousesCount || 6}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Instalaciones registradas</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Capacidad Almacenaje</span>
            <Layers size={20} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : `${data?.stats?.totalStorageM3 || 1440.0} m³`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px' }}>Volumen global de red</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <span>Ocupación Global</span>
            <Activity size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {loading ? '...' : `${data?.stats?.totalOccupiedM3 || 560.4} m³`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Capacidad efectiva utilizada</div>
        </div>
      </div>

      {/* Companies List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="var(--primary)" />
            Empresas Clientes en la Plataforma
          </h3>
          <button onClick={() => onNavigate('companies')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            <span>Ver Todas</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(data?.companiesList || []).map((comp: any) => (
            <div
              key={comp.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{comp.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>RUT: {comp.taxId}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{comp.warehousesCount} Bodega(s)</span>
                <span className="badge badge-primary">{comp.planName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
