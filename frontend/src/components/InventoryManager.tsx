import React, { useState } from 'react';
import { Package, ArrowUpRight, History, PlusCircle } from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const [stock] = useState([
    {
      id: 'inv-1',
      product_name: 'Caja Harina Industrial 25kg',
      sku: 'HAR-IND-25',
      location: 'A1-N1-P1 (Bodega Pudahuel)',
      quantity: 50,
      occupancy_type: 'BOXES',
      occupied_m3: 2.1,
      client_name: 'Propio (Empresa Logística Demo)',
      entered_at: '2026-07-30 14:20',
    },
    {
      id: 'inv-2',
      product_name: 'Palet Mariscos Congelados Premium',
      sku: 'MAR-CONG-P01',
      location: 'F1-N1-P1 (Bodega Pudahuel - Fría)',
      quantity: 1,
      occupancy_type: 'PALLET',
      occupied_m3: 2.9,
      client_name: 'Cliente Tercero Rentas SpA (Futuro 3PL)',
      entered_at: '2026-07-31 09:15',
    },
  ]);

  const [movements] = useState([
    { id: 'mov-1', type: 'INBOUND', item: 'Palet Mariscos Congelados', qty: 1, dest: 'F1-N1-P1', user: 'Admin Principal', time: 'Hoy 09:15' },
    { id: 'mov-2', type: 'INBOUND', item: 'Caja Harina Industrial 25kg', qty: 50, dest: 'A1-N1-P1', user: 'Admin Principal', time: 'Ayer 14:20' },
  ]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      {/* Stock Listing */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="var(--primary)" />
              Existencias Almacenadas e Inventario
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Gestión de existencias por volumen (m³), tipo de almacenamiento y propietario
            </p>
          </div>

          <button
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--primary)',
              color: '#090d16',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PlusCircle size={16} />
            Ingresar Mercadería
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px' }}>Producto / SKU</th>
              <th style={{ padding: '10px' }}>Ubicación</th>
              <th style={{ padding: '10px' }}>Cantidad</th>
              <th style={{ padding: '10px' }}>Volumen (m³)</th>
              <th style={{ padding: '10px' }}>Propietario</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                  {item.product_name}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
                </td>
                <td style={{ padding: '10px', color: 'var(--primary)' }}>{item.location}</td>
                <td style={{ padding: '10px' }}>{item.quantity} unidades</td>
                <td style={{ padding: '10px' }}>{item.occupied_m3} m³</td>
                <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.client_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kardex Movements Audit Stream */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--primary)" />
          Histórico de Movimientos (Kardex)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {movements.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={14} />
                  {m.type}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.time}</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{m.item}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Ubicación: <strong>{m.dest}</strong> | Por: {m.user}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
