import React, { useState, useEffect } from 'react';
import { Crown, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { apiFetch } from '../config/api';

export interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanName?: string;
  limitReason?: string;
}

export interface PlanInfo {
  id: string;
  name: string;
  max_warehouses: number;
  max_users: number;
  max_storage_m3: number;
  price_monthly: number;
  currency: string;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlanName = 'Básico',
  limitReason,
}) => {
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiFetch<PlanInfo[]>('/saas/plans')
        .then((data) => {
          if (Array.isArray(data)) setPlans(data);
        })
        .catch((err) => console.error('Error cargando planes:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '850px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="badge badge-warning" style={{ padding: '8px 12px', borderRadius: '12px' }}>
              <Crown size={20} color="var(--warning)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Actualizar Plan SaaS — Escala tus Operaciones
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {limitReason ||
                  `Tu plan actual (${currentPlanName}) ha alcanzado sus cuotas operativas. Elige un plan superior.`}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Reason Alert Banner */}
        {limitReason && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.8rem' }}>
            <ShieldAlert size={16} />
            <span>{limitReason}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Cargando planes disponibles...
            </div>
          ) : (
            plans.map((p) => {
              const isCurrent = p.name.toUpperCase() === currentPlanName.toUpperCase();
              return (
                <div
                  key={p.id}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: isCurrent ? 0.65 : 1,
                    borderColor: isCurrent ? 'var(--border-color)' : 'var(--border-accent)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</h3>
                      {isCurrent && <span className="badge badge-primary">Actual</span>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${Number(p.price_monthly).toLocaleString('es-CL')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / mes {p.currency}</span>
                    </div>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="var(--accent)" />
                        <span>Hasta <strong>{p.max_warehouses}</strong> Bodega(s)</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="var(--accent)" />
                        <span>Hasta <strong>{p.max_users}</strong> Usuarios</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="var(--accent)" />
                        <span>Hasta <strong>{p.max_storage_m3} m³</strong> Almacenamiento</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    disabled={isCurrent}
                    onClick={() => {
                      alert(`Solicitud de actualización al plan ${p.name} enviada. Un Ejecutivo te contactará a la brevedad.`);
                      onClose();
                    }}
                    className={isCurrent ? 'btn btn-secondary' : 'btn btn-primary'}
                    style={{ width: '100%' }}
                  >
                    <span>{isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}</span>
                    {!isCurrent && <ArrowRight size={14} />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <span>¿Necesitas un plan personalizado Enterprise? Contacta a ventas@bodegia.cl</span>
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
