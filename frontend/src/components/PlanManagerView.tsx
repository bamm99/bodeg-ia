import React, { useState, useEffect } from 'react';
import { Crown, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { apiFetch } from '../config/api';

export interface PlanItem {
  id: string;
  name: string;
  max_warehouses: number;
  max_users: number;
  max_storage_m3: number;
  price_monthly: number;
  currency: string;
  is_active: boolean;
}

export const PlanManagerView: React.FC = () => {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [maxWarehouses, setMaxWarehouses] = useState(1);
  const [maxUsers, setMaxUsers] = useState(5);
  const [maxStorageM3, setMaxStorageM3] = useState(500);
  const [priceMonthly, setPriceMonthly] = useState(0);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<PlanItem[]>('/saas/plans');
      if (Array.isArray(data)) setPlans(data);
    } catch (err) {
      console.error('Error al cargar planes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlanId(null);
    setName('');
    setMaxWarehouses(1);
    setMaxUsers(5);
    setMaxStorageM3(500);
    setPriceMonthly(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PlanItem) => {
    setEditingPlanId(p.id);
    setName(p.name);
    setMaxWarehouses(p.max_warehouses);
    setMaxUsers(p.max_users);
    setMaxStorageM3(Number(p.max_storage_m3));
    setPriceMonthly(Number(p.price_monthly));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlanId) {
        await apiFetch(`/saas/plans/${editingPlanId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            max_warehouses: maxWarehouses,
            max_users: maxUsers,
            max_storage_m3: maxStorageM3,
            price_monthly: priceMonthly,
          }),
        });
      } else {
        await apiFetch('/saas/plans', {
          method: 'POST',
          body: JSON.stringify({
            name,
            max_warehouses: maxWarehouses,
            max_users: maxUsers,
            max_storage_m3: maxStorageM3,
            price_monthly: priceMonthly,
            currency: 'CLP',
          }),
        });
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Error guardando plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Desactivar este plan SaaS?')) {
      try {
        await apiFetch(`/saas/plans/${id}`, { method: 'DELETE' });
        fetchPlans();
      } catch (err: any) {
        alert(err.message || 'Error desactivando plan');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={24} color="var(--warning)" />
            <span>Gestión de Planes SaaS & Tarifas</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configura los límites de cuotas (bodegas, usuarios y m³ de almacenamiento) para cada oferta comercial.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>Crear Nuevo Plan</span>
        </button>
      </div>

      {/* Grid of Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>Cargando planes...</div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="badge badge-warning">
                    {p.name}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleOpenEdit(p)} className="btn btn-secondary" style={{ padding: '6px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-danger" style={{ padding: '6px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    ${Number(p.price_monthly).toLocaleString('es-CL')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / mes {p.currency}</span>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="var(--accent)" />
                    <span>Límite Bodegas: <strong>{p.max_warehouses}</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="var(--accent)" />
                    <span>Límite Usuarios: <strong>{p.max_users}</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="var(--accent)" />
                    <span>Límite Almacenamiento: <strong>{p.max_storage_m3} m³</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingPlanId ? 'Editar Plan SaaS' : 'Crear Plan SaaS'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Nombre del Plan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Máx. Bodegas</label>
                  <input
                    type="number"
                    value={maxWarehouses}
                    onChange={(e) => setMaxWarehouses(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Máx. Usuarios</label>
                  <input
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Máx. m³ Almacenaje</label>
                  <input
                    type="number"
                    value={maxStorageM3}
                    onChange={(e) => setMaxStorageM3(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Precio Mensual (CLP)</label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
