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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>Gestión de Planes SaaS & Tarifas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configura los límites de cuotas (bodegas, usuarios y m³ de almacenamiento) para cada oferta comercial.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Plan</span>
        </button>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-10 text-center text-slate-500 text-xs">Cargando planes...</div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                    {p.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-black text-slate-100">
                    ${Number(p.price_monthly).toLocaleString('es-CL')}
                  </span>
                  <span className="text-xs text-slate-400"> / mes {p.currency}</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Límite Bodegas: <strong>{p.max_warehouses}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Límite Usuarios: <strong>{p.max_users}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingPlanId ? 'Editar Plan SaaS' : 'Crear Plan SaaS'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Máx. Bodegas</label>
                  <input
                    type="number"
                    value={maxWarehouses}
                    onChange={(e) => setMaxWarehouses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Máx. Usuarios</label>
                  <input
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Máx. Almacenamiento (m³)</label>
                  <input
                    type="number"
                    value={maxStorageM3}
                    onChange={(e) => setMaxStorageM3(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Precio Mensual (CLP)</label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
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
