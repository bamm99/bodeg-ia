import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, Cpu, AlertCircle } from 'lucide-react';
import { apiFetch } from '../config/api';

interface CostProfile {
  id: string;
  daily_base_cost: number;
  currency: string;
  turnover_multiplier: number;
  maintenance_cost_daily: number;
  energy_cost_daily: number;
  seasonal_factor: number;
  custom_formula_expression?: string;
  zone_id?: string;
  rack_id?: string;
  level_id?: string;
  zones?: { name: string };
  racks?: { code: string };
  levels?: { code: string };
}

export const CostProfilesManagerView: React.FC = () => {
  const [profiles, setProfiles] = useState<CostProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CostProfile | null>(null);

  // Exclusive Arc Selection (Zone, Rack, Level)
  const [arcType, setArcType] = useState<'ZONE' | 'RACK' | 'LEVEL'>('ZONE');
  const [targetId, setTargetId] = useState('');

  const [formData, setFormData] = useState({
    daily_base_cost: 150.0,
    currency: 'CLP',
    turnover_multiplier: 1.0,
    maintenance_cost_daily: 20.0,
    energy_cost_daily: 15.0,
    seasonal_factor: 1.0,
    custom_formula_expression: '',
  });

  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/costs/profiles');
      if (res.data) setProfiles(res.data);
    } catch (err) {
      console.error('Error cargando perfiles de costos AST:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenModal = (p?: CostProfile) => {
    setError(null);
    if (p) {
      setEditingProfile(p);
      if (p.zone_id) { setArcType('ZONE'); setTargetId(p.zone_id); }
      else if (p.rack_id) { setArcType('RACK'); setTargetId(p.rack_id); }
      else if (p.level_id) { setArcType('LEVEL'); setTargetId(p.level_id); }
      setFormData({
        daily_base_cost: Number(p.daily_base_cost),
        currency: p.currency,
        turnover_multiplier: Number(p.turnover_multiplier),
        maintenance_cost_daily: Number(p.maintenance_cost_daily),
        energy_cost_daily: Number(p.energy_cost_daily),
        seasonal_factor: Number(p.seasonal_factor),
        custom_formula_expression: p.custom_formula_expression || '',
      });
    } else {
      setEditingProfile(null);
      setArcType('ZONE');
      setTargetId('');
      setFormData({
        daily_base_cost: 150.0,
        currency: 'CLP',
        turnover_multiplier: 1.0,
        maintenance_cost_daily: 20.0,
        energy_cost_daily: 15.0,
        seasonal_factor: 1.0,
        custom_formula_expression: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.daily_base_cost < 0) {
      setError('La tarifa base diaria no puede ser negativa');
      return;
    }

    const payload = {
      ...formData,
      zone_id: arcType === 'ZONE' && targetId ? targetId : null,
      rack_id: arcType === 'RACK' && targetId ? targetId : null,
      level_id: arcType === 'LEVEL' && targetId ? targetId : null,
    };

    try {
      if (editingProfile) {
        await apiFetch(`/costs/profiles/${editingProfile.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/costs/profiles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchProfiles();
    } catch (err: any) {
      setError(err.message || 'Error al guardar perfil de costo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este perfil de tarifa AST?')) return;
    try {
      await apiFetch(`/costs/profiles/${id}`, { method: 'DELETE' });
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar tarifa');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={24} color="var(--primary)" />
            Gestor de Tarifario & Perfiles de Costo AST
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configura tarifas de almacenamiento m³/día asociadas al Arco Exclusivo (Zona, Repisa 2D o Nivel).
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={16} />
          <span>Nuevo Perfil de Tarifa AST</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Nivel de Arco Exclusivo</th>
              <th style={{ padding: '16px' }}>Tarifa Base Diaria</th>
              <th style={{ padding: '16px' }}>Factor Rotación / Temporada</th>
              <th style={{ padding: '16px' }}>Mantenimiento / Energía</th>
              <th style={{ padding: '16px' }}>Fórmula Personalizada AST</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando perfiles de costos...
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay perfiles de tarifa registrados.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                    {p.zones?.name
                      ? `Zona: ${p.zones.name}`
                      : p.racks?.code
                      ? `Repisa 2D: ${p.racks.code}`
                      : p.levels?.code
                      ? `Nivel: ${p.levels.code}`
                      : 'Nivel General Bodega'}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 800, color: '#10b981' }}>
                    ${Number(p.daily_base_cost).toLocaleString('es-CL')} {p.currency} / m³-día
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    Rot: x{p.turnover_multiplier} | Temp: x{p.seasonal_factor}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    Mant: ${p.maintenance_cost_daily} | Enrg: ${p.energy_cost_daily}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {p.custom_formula_expression ? (
                      <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>
                        <Cpu size={12} /> {p.custom_formula_expression}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estándar Base</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(p)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }}>
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              {editingProfile ? 'Editar Perfil de Costo AST' : 'Crear Perfil de Tarifa AST'}
            </h3>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Tarifa Base (m³/día) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.daily_base_cost}
                    onChange={(e) => setFormData({ ...formData, daily_base_cost: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Moneda</label>
                  <select
                    className="input"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="CLP">CLP ($)</option>
                    <option value="USD">USD ($)</option>
                    <option value="UF">UF (Unidad Fomento)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Mult. Rotación</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.turnover_multiplier}
                    onChange={(e) => setFormData({ ...formData, turnover_multiplier: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Mant. Diario</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.maintenance_cost_daily}
                    onChange={(e) => setFormData({ ...formData, maintenance_cost_daily: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Energía Diaria</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={formData.energy_cost_daily}
                    onChange={(e) => setFormData({ ...formData, energy_cost_daily: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Fórmula Personalizada AST (Opcional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. (base * turnover + maintenance) * seasonal"
                  value={formData.custom_formula_expression}
                  onChange={(e) => setFormData({ ...formData, custom_formula_expression: e.target.value })}
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Variables permitidas: base, turnover, maintenance, energy, seasonal, occupied_m3, total_m3, occupancy_pct
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProfile ? 'Guardar Cambios' : 'Crear Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
