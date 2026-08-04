import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../config/api';

export const RelocateFormView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    destination_location_id: '',
    quantity: 1,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await apiFetch('/inventory/items?limit=100');
        if (res.data) setItems(res.data);
      } catch (err) {
        console.error('Error cargando ítems de inventario:', err);
      }
    }
    loadItems();
  }, []);

  const generateUUID = () => {
    return 'idemp-rel-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inventory_item_id || !formData.destination_location_id) {
      setMessage({ type: 'error', text: 'Debe seleccionar un ítem y casillero de destino' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const idempotencyKey = generateUUID();

      await apiFetch('/inventory/relocate', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify(formData),
      });

      setMessage({ type: 'success', text: '¡Mercancía reubicada exitosamente en Kardex!' });
      setFormData({ inventory_item_id: '', destination_location_id: '', quantity: 1 });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar la reubicación' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={24} color="var(--primary)" />
          Reubicación Directa entre Casilleros (Relocate)
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Transfiere stock entre posiciones de almacenamiento con supervisión ex-post y control de Idempotencia.
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
              Mercancía / Lote a Reubicar *
            </label>
            <select
              className="input"
              value={formData.inventory_item_id}
              onChange={(e) => setFormData({ ...formData, inventory_item_id: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="">-- Selecciona Mercancía en Stock --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.products?.name} (SKU: {i.products?.sku}) — Lote: {i.lot_number || 'N/A'} [{i.quantity} unid]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Cantidad de Unidades a Mover *
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
              ID de Casillero Destino *
            </label>
            <input
              type="text"
              className="input"
              placeholder="ej. loc-pud-a2-r2-l1-05"
              value={formData.destination_location_id}
              onChange={(e) => setFormData({ ...formData, destination_location_id: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '12px' }}>
            <RefreshCw size={18} />
            <span>{loading ? 'Reubicando Mercancía...' : 'Confirmar Reubicación (Relocate)'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
