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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Actualizar Plan SaaS — Escala tus Operaciones
            </h2>
            <p className="text-xs text-slate-400">
              {limitReason ||
                `Tu plan actual (${currentPlanName}) ha alcanzado sus cuotas operativas. Elige un plan superior.`}
            </p>
          </div>
        </div>

        {/* Reason Alert Banner if HTTP 402 triggered */}
        {limitReason && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{limitReason}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {loading ? (
            <div className="col-span-3 text-center py-10 text-slate-500 text-sm">
              Cargando planes disponibles...
            </div>
          ) : (
            plans.map((p) => {
              const isCurrent = p.name.toUpperCase() === currentPlanName.toUpperCase();
              return (
                <div
                  key={p.id}
                  className={`flex flex-col justify-between p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-800/40 border-slate-700 opacity-70'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 hover:shadow-lg'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-200 text-base">{p.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          Actual
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-black text-emerald-400">
                        ${Number(p.price_monthly).toLocaleString('es-CL')}
                      </span>
                      <span className="text-xs text-slate-400 font-normal"> / mes {p.currency}</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Hasta {p.max_warehouses} Bodega(s)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Hasta {p.max_users} Usuarios</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Hasta {p.max_storage_m3} m³ Almacenamiento</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    disabled={isCurrent}
                    onClick={() => {
                      alert(`Solicitud de actualización al plan ${p.name} enviada. Un Ejecutivo te contactará a la brevedad.`);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-xs transition-colors ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    <span>{isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}</span>
                    {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-800 pt-4">
          <span>¿Necesitas un plan personalizado Enterprise? Contacta a ventas@bodegia.cl</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
