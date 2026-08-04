import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { apiFetch } from '../config/api';

interface DispatchRequest {
  id: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  clients?: { name: string; tax_id?: string };
  products?: { sku: string; name: string };
  users_dispatch_requests_requested_by_user_idTousers?: { full_name: string; email: string };
  users_dispatch_requests_approved_by_user_idTousers?: { full_name: string; email: string };
}

export const PendingDispatchRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<DispatchRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/inventory/dispatch-requests');
      if (res.data) setRequests(res.data);
    } catch (err) {
      console.error('Error cargando solicitudes de despacho 3PL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/inventory/dispatch-requests/${id}/approve`, { method: 'PUT' });
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar solicitud');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Ingrese el motivo de rechazo para el cliente 3PL:');
    if (reason === null) return;
    try {
      await apiFetch(`/inventory/dispatch-requests/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ rejection_reason: reason }),
      });
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar solicitud');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const filtered = requests.filter(
    (r) =>
      r.clients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.products?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.products?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="var(--primary)" />
            Solicitudes de Despacho 3PL (Autorización Outbound)
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Revisa y autoriza las solicitudes emitidas por clientes 3PL antes del retiro físico en bodega.
          </p>
        </div>

        <div className="badge badge-warning" style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '0.85rem' }}>
          <Clock size={16} />
          <span>{pendingCount} Pendiente(s) por Autorizar</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por cliente 3PL o SKU de producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Cliente 3PL Solicitante</th>
              <th style={{ padding: '16px' }}>Producto / SKU</th>
              <th style={{ padding: '16px' }}>Cantidad</th>
              <th style={{ padding: '16px' }}>Estado Solicitud</th>
              <th style={{ padding: '16px' }}>Solicitado El</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando solicitudes 3PL...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay solicitudes de despacho registradas.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    <div>{r.clients?.name || 'Cliente 3PL'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RUT: {r.clients?.tax_id || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>{r.products?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>SKU: {r.products?.sku}</div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#fff' }}>
                    {r.quantity} unid
                  </td>
                  <td style={{ padding: '16px' }}>
                    {r.status === 'PENDING' ? (
                      <span className="badge badge-warning">⏳ Pendiente</span>
                    ) : r.status === 'APPROVED' ? (
                      <span className="badge badge-primary">✅ Aprobado (Listo)</span>
                    ) : r.status === 'FULFILLED' ? (
                      <span className="badge badge-success">📦 Despachado</span>
                    ) : (
                      <span className="badge badge-danger">❌ Rechazada</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {r.status === 'PENDING' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => handleApprove(r.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          <CheckCircle2 size={14} />
                          <span>Aprobar</span>
                        </button>
                        <button onClick={() => handleReject(r.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }}>
                          <XCircle size={14} />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Procesado</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
