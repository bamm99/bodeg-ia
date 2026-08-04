import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../config/api';

export const OutboundFormView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    inventory_item_id: '',
    quantity: 1,
    dispatch_request_id: '',
  });

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [itemsRes, reqsRes] = await Promise.all([
          apiFetch('/inventory/items?limit=100'),
          apiFetch('/inventory/dispatch-requests'),
        ]);

        if (itemsRes.data) setItems(itemsRes.data);
        if (reqsRes.data) {
          const appr = reqsRes.data.filter((r: any) => r.status === 'APPROVED');
          setApprovedRequests(appr);
        }
      } catch (err) {
        console.error('Error cargando datos Outbound:', err);
      }
    }
    loadData();
  }, []);

  const handleItemChange = (itemId: string) => {
    setFormData({ ...formData, inventory_item_id: itemId });
    const found = items.find((i) => i.id === itemId);
    setSelectedItem(found || null);
  };

  const generateUUID = () => {
    return 'idemp-out-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inventory_item_id) {
      setMessage({ type: 'error', text: 'Debe seleccionar una mercancía a despachar' });
      return;
    }

    const is3PL = selectedItem?.clients && !selectedItem.clients.is_internal_company;
    if (is3PL && !formData.dispatch_request_id) {
      setMessage({
        type: 'error',
        text: '⚠️ La mercancía pertenece a un Cliente 3PL externo y exige vincular una Solicitud Aprobada (APPROVED)',
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const idempotencyKey = generateUUID();

      await apiFetch('/inventory/outbound', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify(formData),
      });

      setMessage({ type: 'success', text: '¡Despacho Outbound procesado y registrado en Kardex!' });
      setFormData({ inventory_item_id: '', quantity: 1, dispatch_request_id: '' });
      setSelectedItem(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar despacho Outbound' });
    } finally {
      setLoading(false);
    }
  };

  const is3PLExternal = selectedItem?.clients && !selectedItem.clients.is_internal_company;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ArrowUpRight size={24} color="#ef4444" />
          Despacho y Salida de Mercancía (Outbound)
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Salida inmediata para stock propio o bifurcada exigiendo solicitud en estado APPROVED para clientes 3PL.
        </p>
      </div>

      {message && (
        <div
          style={{
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Panel */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Mercancía a Despachar *
            </label>
            <select
              className="input"
              value={formData.inventory_item_id}
              onChange={(e) => handleItemChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">-- Selecciona Mercancía en Stock --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.products?.name} (SKU: {i.products?.sku}) — {i.clients?.name} [{i.quantity} unid]
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div
              style={{
                background: is3PLExternal ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${is3PLExternal ? '#f59e0b' : '#10b981'}`,
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.8rem',
              }}
            >
              <strong>Flujo de Salida: </strong>
              {is3PLExternal
                ? '🔒 Mercancía 3PL de Cliente Externo (Exige Solicitud de Despacho Aprobada)'
                : '⚡ Stock Propio de la Empresa (Despacho Directo e Inmediato)'}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Cantidad a Despachar *
            </label>
            <input
              type="number"
              className="input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          {is3PLExternal && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Solicitud de Despacho 3PL Autorizada (APPROVED) *
              </label>
              <select
                className="input"
                value={formData.dispatch_request_id}
                onChange={(e) => setFormData({ ...formData, dispatch_request_id: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">-- Selecciona Solicitud en Estado APPROVED --</option>
                {approvedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    Solicitud #{r.id.substring(0, 8)} — {r.clients?.name} ({r.quantity} unid {r.products?.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '12px', background: '#ef4444' }}>
            <ArrowUpRight size={18} />
            <span>{loading ? 'Procesando Despacho...' : 'Confirmar Salida Outbound'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
