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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{company?.name || 'Cargando...'}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Hash className="w-3 h-3 text-slate-500" /> RUT: {company?.tax_id}
                </span>
                {company?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" /> {company?.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800/80 pb-2 mb-4">
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs">Cargando empresa...</div>
            ) : usageStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="text-center py-6 text-slate-500 text-xs">Cargando consumo...</div>
            )}

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Casa Matriz: {company?.address || 'No especificada'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Sucursales Configura: {company?.branches?.length || 0} sucursal(es)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {company?.users?.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{u.full_name}</p>
                  <p className="text-slate-400 text-[10px]">{u.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {u.is_active ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Subscription */}
        {activeTab === 'subscription' && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Plan Actual:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {company?.subscriptions?.[0]?.plans?.name || 'BASIC'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Estado Suscripción:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                {company?.subscriptions?.[0]?.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
