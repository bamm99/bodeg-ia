import React, { useState, useEffect } from 'react';
import { Building2, X, Users, Crown, Activity, Layers, Phone, MapPin, Hash } from 'lucide-react';
import { apiFetch } from '../config/api';
import { PlanUsageBar } from './PlanUsageBar';

export interface CompanyDetailModalProps {
  companyId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  companyId,
  isOpen,
  onClose,
}) => {
  const [company, setCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscription'>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      setLoading(true);
      apiFetch(`/saas/companies/${companyId}`)
        .then((res) => {
          if (res.data) setCompany(res.data);
        })
        .catch((err) => console.error('Error cargando empresa:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, companyId]);

  if (!isOpen || !companyId) return null;

  const usageStats = company?.usageStats;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '750px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="badge badge-primary" style={{ padding: '8px 12px', borderRadius: '12px' }}>
              <Building2 size={24} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{company?.name || 'Cargando...'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                  <Hash size={12} color="var(--text-muted)" /> RUT: {company?.tax_id}
                </span>
                {company?.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} color="var(--text-muted)" /> {company?.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
          {[
            { id: 'overview', label: 'Resumen & Consumo', icon: Activity },
            { id: 'users', label: 'Usuarios', icon: Users },
            { id: 'subscription', label: 'Suscripción & Plan', icon: Crown },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={isActive ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cargando empresa...</div>
            ) : usageStats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <PlanUsageBar
                  label="Bodegas Ocupadas"
                  current={usageStats.usage.warehousesCount}
                  max={usageStats.limits.maxWarehouses}
                  iconType="warehouse"
                />
                <PlanUsageBar
                  label="Usuarios Activos"
                  current={usageStats.usage.usersCount}
                  max={usageStats.limits.maxUsers}
                  iconType="users"
                />
                <PlanUsageBar
                  label="Almacenamiento m³"
                  current={usageStats.usage.storageM3Occupied}
                  max={usageStats.limits.maxStorageM3}
                  unit="m³"
                  iconType="storage"
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cargando consumo...</div>
            )}

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <MapPin size={16} color="var(--primary)" />
                <span>Casa Matriz: {company?.address || 'No especificada'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Layers size={16} color="var(--primary)" />
                <span>Sucursales Configura: {company?.branches?.length || 0} sucursal(es)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {company?.users?.map((u: any) => (
              <div key={u.id} className="glass-panel" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.full_name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{u.email}</p>
                </div>
                <span className={u.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                  {u.is_active ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Subscription */}
        {activeTab === 'subscription' && (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Plan Actual:</span>
              <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1rem' }}>
                {company?.subscriptions?.[0]?.plans?.name || 'BASIC'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado Suscripción:</span>
              <span className="badge badge-success">
                {company?.subscriptions?.[0]?.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
