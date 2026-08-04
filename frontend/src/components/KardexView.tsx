import React, { useState, useEffect } from 'react';
import { Package, ArrowDownRight, ArrowUpRight, RefreshCw, User } from 'lucide-react';
import { apiFetch } from '../config/api';

interface Movement {
  id: string;
  movement_type: 'INBOUND' | 'RELOCATION' | 'OUTBOUND';
  quantity: number;
  created_at: string;
  inventory_items?: {
    products?: {
      sku: string;
      name: string;
    };
  };
  users?: {
    full_name: string;
    email: string;
  };
  storage_locations_inventory_movements_source_location_idTostorage_locations?: { code: string };
  storage_locations_inventory_movements_destination_location_idTostorage_locations?: { code: string };
}

export const KardexView: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/inventory/movements?limit=100');
      if (res.data) setMovements(res.data);
    } catch (err) {
      console.error('Error cargando Kardex:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={24} color="var(--primary)" />
          Histórico Kardex Inmutable de Movimientos
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Trazabilidad inmutable de entradas (Inbound), reubicaciones (Relocate) y salidas (Outbound) en tiempo real.
        </p>
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Tipo Movimiento</th>
              <th style={{ padding: '16px' }}>Producto / SKU</th>
              <th style={{ padding: '16px' }}>Cantidad</th>
              <th style={{ padding: '16px' }}>Origen / Destino</th>
              <th style={{ padding: '16px' }}>Operador Responsable</th>
              <th style={{ padding: '16px' }}>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando registro Kardex...
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay movimientos registrados en el Kardex.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    {m.movement_type === 'INBOUND' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowDownRight size={14} /> INBOUND (Ingreso)
                      </span>
                    ) : m.movement_type === 'RELOCATION' ? (
                      <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <RefreshCw size={14} /> RELOCATION (Mover)
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={14} /> OUTBOUND (Salida)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    <div>{m.inventory_items?.products?.name || 'Producto N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                      SKU: {m.inventory_items?.products?.sku}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#fff' }}>
                    {m.quantity} unid
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {m.storage_locations_inventory_movements_source_location_idTostorage_locations?.code || 'Recepción'}{' '}
                    &rarr;{' '}
                    {m.storage_locations_inventory_movements_destination_location_idTostorage_locations?.code || 'Despacho'}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} />
                      <span>{m.users?.full_name || 'Sistema'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at).toLocaleString('es-CL')}
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
