import React, { useState, useEffect } from 'react';
import { Package, Clock, Box, ShieldCheck, Search, Activity } from 'lucide-react';
import { apiFetch } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface InventoryItem {
  id: string;
  quantity: number;
  lot_number: string;
  expiration_date: string;
  occupancy_type: string;
  occupied_m3: number;
  entered_at: string;
  products?: {
    sku: string;
    name: string;
    unit_volume_m3: number;
  };
  storage_locations?: {
    code: string;
  };
}

export const ClientPortalDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeLeftMinutes, setTimeLeftMinutes] = useState(15);

  // Inactivity Timer (15 minutes client-side countdown matching server-side policy)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftMinutes((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // 1 minuto

    return () => clearInterval(timer);
  }, [logout]);

  const fetchOwnStock = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/inventory/items?limit=100');
      if (res.data) setItems(res.data);
    } catch (err) {
      console.error('Error cargando inventario 3PL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnStock();
  }, []);

  const totalOccupiedM3 = items.reduce((acc, curr) => acc + Number(curr.occupied_m3 || 0), 0);
  const totalPallets = items.filter((i) => i.occupancy_type === 'PALLET').length;

  const filtered = items.filter(
    (i) =>
      i.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.products?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.lot_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 15m Inactivity Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderColor: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', fontSize: '0.85rem' }}>
          <Clock size={18} />
          <span>
            <strong>Portal de Autoservicio 3PL:</strong> Tu sesión se auto-cerrará tras 15 minutos de inactividad por políticas de ciberseguridad.
          </span>
        </div>
        <div className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
          ⏱️ Auto-Cierre en ~{timeLeftMinutes} min
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="var(--primary)" />
            Stock Propietario Depositado — {user?.fullName || 'Cliente 3PL'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Consulta inmutable en tiempo real de tu mercancía en almacenamiento.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box size={28} color="var(--primary)" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volumen Depositado Total</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {totalOccupiedM3.toFixed(2)} m³
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Package size={28} color="#38bdf8" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ítems en Almacén</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {items.length} Lotes
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Palets Completos</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
              {totalPallets} Posiciones
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar en tu inventario por producto, SKU o lote..."
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
              <th style={{ padding: '16px' }}>Producto / SKU</th>
              <th style={{ padding: '16px' }}>Número de Lote</th>
              <th style={{ padding: '16px' }}>Cantidad</th>
              <th style={{ padding: '16px' }}>Volumen (m³)</th>
              <th style={{ padding: '16px' }}>Ubicación Asignada</th>
              <th style={{ padding: '16px' }}>Fecha Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando tu inventario...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron productos depositados bajo tu cuenta.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    <div>{item.products?.name || 'Producto N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>SKU: {item.products?.sku}</div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {item.lot_number}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#fff' }}>
                    {item.quantity} unid
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {item.occupied_m3} m³
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className="badge badge-primary">{item.storage_locations?.code || 'Bodega Pudahuel'}</span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString('es-CL') : 'N/A'}
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
