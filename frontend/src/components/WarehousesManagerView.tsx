import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Search, Edit2, Trash2, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../config/api';
import { PlanUpgradeModal } from './PlanUpgradeModal';

interface Branch {
  id: string;
  name: string;
}

interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  branch_id?: string;
  branches?: Branch;
  is_cost_tracking_enabled: boolean;
}

export const WarehousesManagerView: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    branch_id: '',
    is_cost_tracking_enabled: true,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchWarehousesAndBranches = async () => {
    try {
      setLoading(true);
      const [wRes, bRes] = await Promise.all([
        apiFetch('/locations/warehouses'),
        apiFetch('/locations/branches'),
      ]);

      if (wRes.data) setWarehouses(wRes.data);
      if (bRes.data) {
        setBranches(bRes.data);
        if (bRes.data.length > 0 && !formData.branch_id) {
          setFormData((prev) => ({ ...prev, branch_id: bRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error cargando bodegas y sucursales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehousesAndBranches();
  }, []);

  const handleOpenModal = (wh?: WarehouseItem) => {
    setError(null);
    if (wh) {
      setEditingWarehouse(wh);
      setFormData({
        name: wh.name,
        code: wh.code,
        branch_id: wh.branch_id || (branches[0]?.id || ''),
        is_cost_tracking_enabled: wh.is_cost_tracking_enabled,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        branch_id: branches[0]?.id || '',
        is_cost_tracking_enabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('El código y el nombre de la bodega son obligatorios');
      return;
    }

    try {
      if (editingWarehouse) {
        await apiFetch(`/locations/warehouses/${editingWarehouse.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch('/locations/warehouses', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      setIsModalOpen(false);
      fetchWarehousesAndBranches();
    } catch (err: any) {
      if (err.status === 402) {
        // Interceptado por planLimitsMiddleware!
        setIsModalOpen(false);
        setUpgradeMessage(err.message || 'Has alcanzado el límite de bodegas permitidas por tu plan SaaS.');
        setIsUpgradeModalOpen(true);
      } else {
        setError(err.message || 'Error al guardar bodega');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta bodega?')) return;
    try {
      await apiFetch(`/locations/warehouses/${id}`, { method: 'DELETE' });
      fetchWarehousesAndBranches();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar bodega');
    }
  };

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.branches?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Warehouse size={24} color="var(--primary)" />
            Gestión de Bodegas & Naves Físicas
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configura tus naves de almacenamiento y activa el motor de seguimiento de costos por bodegaje AST.
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={16} />
          <span>Nueva Bodega</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por código, nombre o sucursal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Código</th>
              <th style={{ padding: '16px' }}>Nombre de la Bodega</th>
              <th style={{ padding: '16px' }}>Sucursal Perteneciente</th>
              <th style={{ padding: '16px' }}>Tracking de Costos AST</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando bodegas...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron bodegas registradas.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                    {w.code}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {w.name}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="var(--primary)" />
                      {w.branches?.name || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {w.is_cost_tracking_enabled ? (
                      <span className="badge badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Habilitado
                      </span>
                    ) : (
                      <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Desactivado
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(w)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(w.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              {editingWarehouse ? 'Editar Bodega' : 'Crear Nueva Bodega'}
            </h3>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Sucursal Perteneciente *</label>
                <select
                  className="input"
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  style={{ width: '100%' }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Código de la Bodega *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. BOD-PUDA-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nombre de la Bodega *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. Bodega Principal Pudahuel (Frío)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="costTrackingToggle"
                  checked={formData.is_cost_tracking_enabled}
                  onChange={(e) => setFormData({ ...formData, is_cost_tracking_enabled: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="costTrackingToggle" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Activar Motor de Cálculo de Costos AST en esta bodega
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingWarehouse ? 'Guardar Cambios' : 'Crear Bodega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Upgrade Upsell Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        limitReason={upgradeMessage}
      />
    </div>
  );
};
