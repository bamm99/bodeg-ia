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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={24} color="var(--primary)" />
          <span>Asignación de Cartolas a Ejecutivos (Portfolio Manager)</span>
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Distribuye empresas clientes entre Ejecutivos de Cuenta (PLATFORM_ADMIN) y consulta la trazabilidad de auditoría.
        </p>
      </div>

      {/* Form Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              ID / UUID de Ejecutivo (PLATFORM_ADMIN)
            </label>
            <input
              type="text"
              placeholder="UUID del Usuario Ejecutivo..."
              value={selectedExecutiveId}
              onChange={(e) => {
                setSelectedExecutiveId(e.target.value);
                loadExecutiveData(e.target.value);
              }}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Seleccionar Empresa Cliente
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="input-field"
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            Motivo / Razón de Asignación (Auditoría)
          </label>
          <input
            type="text"
            placeholder="Ej: Asignación por reestructuración de zona geográfica norte"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input-field"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button onClick={() => handleAssign('ASSIGN')} className="btn btn-primary">
            <span>Asignar a Cartola</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Active Portfolio & Audit Grid */}
      {selectedExecutiveId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Portfolio Panel */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--primary)" />
              <span>Cartola Activa del Ejecutivo</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {loading ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0', fontSize: '0.8rem' }}>Cargando cartola...</p>
              ) : portfolio.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0', fontSize: '0.8rem' }}>No tiene empresas en cartola.</p>
              ) : (
                portfolio.map((c) => (
                  <div key={c.id} className="glass-panel" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RUT: {c.tax_id}</p>
                    </div>
                    <button onClick={() => handleAssign('UNASSIGN', c.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Desvincular
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit History Panel */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--warning)" />
              <span>Historial de Auditoría (Trazabilidad)</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {auditHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0', fontSize: '0.8rem' }}>Sin registro previo.</p>
              ) : (
                auditHistory.map((h) => (
                  <div key={h.id} className="glass-panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={h.action === 'ASSIGNED' ? 'badge badge-success' : 'badge badge-danger'}>
                        {h.action}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-main)' }}>Empresa ID: {h.company_id}</p>
                    {h.reason && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>{h.reason}</p>}
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
