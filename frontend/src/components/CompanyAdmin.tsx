import React from 'react';
import { Users, CreditCard } from 'lucide-react';

export const CompanyAdmin: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Active Subscription & Limits */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} color="var(--primary)" />
          Suscripción & Plan Multi-tenant
        </h2>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(129, 140, 248, 0.1) 100%)',
            border: '1px solid var(--border-accent)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-low" style={{ marginBottom: '8px' }}>Suscripción Activa</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Plan ENTERPRISE</h3>
            </div>
            <div style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
              $399.900 CLP <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ mes</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Bodegas Máximas:</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Ilimitadas (99)</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Usuarios:</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Hasta 999</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Capacidad Storage:</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Ilimitada m³</div>
            </div>
          </div>
        </div>
      </div>

      {/* Roles & Team */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--primary)" />
          Equipo & Asignación de Roles RBAC
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '12px', background: '#0d131f', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Administrador Principal (Tú)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@bodegia.cl</div>
            </div>
            <span className="badge badge-high">SUPER_ADMIN</span>
          </div>

          <div style={{ padding: '12px', background: '#0d131f', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Carlos Mendoza (Jefe de Bodega)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>cmendoza@bodegia.cl</div>
            </div>
            <span className="badge badge-medium">WAREHOUSE_MANAGER</span>
          </div>
        </div>
      </div>
    </div>
  );
};
