import React, { useState, useEffect } from 'react';
import { UserCheck, Building2, ArrowRight, History } from 'lucide-react';
import { apiFetch } from '../config/api';

export const ExecutiveAssignmentView: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [reason, setReason] = useState('');

  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar empresas
    apiFetch('/saas/companies?limit=100').then((res) => {
      if (res.data) setCompanies(res.data);
    });

    // Cargar ejecutivos (usuarios PLATFORM_ADMIN)
    apiFetch('/saas/companies/1').catch(() => {}); // warmup
  }, []);

  const loadExecutiveData = async (execId: string) => {
    if (!execId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/saas/executives/${execId}/portfolio`);
      if (res.data) {
        setPortfolio(res.data.portfolio || []);
        setAuditHistory(res.data.auditHistory || []);
      }
    } catch (err) {
      console.error('Error cargando cartola:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (action: 'ASSIGN' | 'UNASSIGN', compId?: string) => {
    const targetCompId = compId || selectedCompanyId;
    if (!selectedExecutiveId || !targetCompId) {
      alert('Debes seleccionar un Ejecutivo y una Empresa cliente.');
      return;
    }

    try {
      await apiFetch('/saas/executives/assign', {
        method: 'POST',
        body: JSON.stringify({
          executiveUserId: selectedExecutiveId,
          companyId: targetCompId,
          action,
          reason,
        }),
      });

      alert(`Empresa cliente ${action === 'ASSIGN' ? 'asignada' : 'desvinculada'} con éxito.`);
      setReason('');
      loadExecutiveData(selectedExecutiveId);
    } catch (err: any) {
      alert(err.message || 'Error en asignación');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-400" />
          <span>Asignación de Cartolas a Ejecutivos (Portfolio Manager)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Distribuye empresas clientes entre Ejecutivos de Cuenta (PLATFORM_ADMIN) y consulta la trazabilidad de auditoría.
        </p>
      </div>

      {/* Form Panel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Seleccionar ID / Email de Ejecutivo (PLATFORM_ADMIN)
            </label>
            <input
              type="text"
              placeholder="UUID de Usuario Ejecutivo..."
              value={selectedExecutiveId}
              onChange={(e) => {
                setSelectedExecutiveId(e.target.value);
                loadExecutiveData(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Seleccionar Empresa Cliente
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
            >
              <option value="">-- Seleccionar Empresa --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tax_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Motivo / Razón de Asignación (Auditoría)
          </label>
          <input
            type="text"
            placeholder="Ej: Asignación por reestructuración de zona geográfica norte"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => handleAssign('ASSIGN')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            <span>Asignar a Cartola</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Portfolio Grid */}
      {selectedExecutiveId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Cartola Activa del Ejecutivo</span>
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {loading ? (
                <p className="text-slate-500 italic py-4">Cargando cartola...</p>
              ) : portfolio.length === 0 ? (
                <p className="text-slate-500 italic py-4">No tiene empresas en cartola.</p>
              ) : (
                portfolio.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-200">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">RUT: {c.tax_id}</p>
                    </div>
                    <button
                      onClick={() => handleAssign('UNASSIGN', c.id)}
                      className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px]"
                    >
                      Desvincular
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Historial de Auditoría (Trazabilidad)</span>
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {auditHistory.length === 0 ? (
                <p className="text-slate-500 italic py-4">Sin registro previo.</p>
              ) : (
                auditHistory.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${h.action === 'ASSIGNED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {h.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[10px]">Empresa ID: {h.company_id}</p>
                    {h.reason && <p className="text-slate-400 italic text-[10px]">{h.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
