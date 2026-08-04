import React, { useState, useEffect } from 'react';
import { ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../config/api';

export const InboundFormView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    product_id: '',
    storage_location_id: '',
    client_owner_id: '',
    quantity: 10,
    lot_number: '',
    expiration_date: '',
    occupancy_type: 'BOXES',
    occupied_m3: 0.5,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [prodRes, cliRes] = await Promise.all([
          apiFetch('/catalog/products?limit=100'),
          apiFetch('/catalog/clients'),
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (cliRes.data) setClients(cliRes.data);
      } catch (err) {
        console.error('Error cargando datos maestros Inbound:', err);
      }
    }
    loadMasterData();
  }, []);

  const generateUUID = () => {
    return 'idemp-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.storage_location_id) {
      setMessage({ type: 'error', text: 'Debe seleccionar un producto y casillero de ubicación' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const idempotencyKey = generateUUID();

      await apiFetch('/inventory/inbound', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify(formData),
      });

      setMessage({ type: 'success', text: '¡Ingreso Inbound registrado exitosamente en Kardex!' });
      setFormData({
        product_id: '',
        storage_location_id: '',
        client_owner_id: '',
        quantity: 10,
        lot_number: '',
        expiration_date: '',
        occupancy_type: 'BOXES',
        occupied_m3: 0.5,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar el ingreso' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ArrowDownRight size={24} color="#10b981" />
          Recepción e Ingreso de Mercancía (Inbound)
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Registra el ingreso de mercancía a casillero con verificación de cubicaje m³ y protección contra doble click (Idempotencia).
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
              Producto (SKU) *
            </label>
            <select
              className="input"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="">-- Selecciona Producto --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Cliente Propietario de la Mercancía *
            </label>
            <select
              className="input"
              value={formData.client_owner_id}
              onChange={(e) => setFormData({ ...formData, client_owner_id: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="">-- Cliente por Defecto (Empresa) --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_internal_company ? '(Interno)' : '(Cliente 3PL)'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Cantidad de Unidades *
              </label>
              <input
                type="number"
                className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Volumen Ocupado (m³) *
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.occupied_m3}
                onChange={(e) => setFormData({ ...formData, occupied_m3: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              ID de Casillero de Ubicación *
            </label>
            <input
              type="text"
              className="input"
              placeholder="ej. loc-pud-a1-r1-l1-01"
              value={formData.storage_location_id}
              onChange={(e) => setFormData({ ...formData, storage_location_id: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Número de Lote (Opcional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="ej. LOTE-2026-X8"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Fecha Vencimiento
              </label>
              <input
                type="date"
                className="input"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '12px' }}>
            <ArrowDownRight size={18} />
            <span>{loading ? 'Registrando Ingreso...' : 'Confirmar Recepción Inbound'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
