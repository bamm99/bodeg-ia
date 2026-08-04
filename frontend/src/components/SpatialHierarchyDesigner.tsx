import React, { useState, useEffect } from 'react';
import { Grid, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../config/api';

export const SpatialHierarchyDesigner: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [warehouseTree, setWarehouseTree] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'zone' | 'aisle' | 'rack' | 'location'>('zone');

  // Form States
  const [zoneData, setZoneData] = useState({ name: '', turnover_rate: 'HIGH' });
  const [aisleData, setAisleData] = useState({ zone_id: '', name: '' });
  const [rackData, setRackData] = useState({ aisle_id: '', code: '', position_x: 1, position_y: 1, width_units: 3, length_units: 2 });
  const [locationData, setLocationData] = useState({ level_id: '', code: '', max_weight_kg: 1200, total_volume_m3: 4.5 });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWarehouses = async () => {
    try {
      const res = await apiFetch('/locations/my-assigned-warehouses');
      if (res.data && res.data.length > 0) {
        setWarehouses(res.data);
        setSelectedWarehouseId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando bodegas:', err);
    }
  };

  const fetchTree = async (whId: string) => {
    if (!whId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/locations/warehouses/${whId}/tree`);
      if (res.data?.warehouse) {
        setWarehouseTree(res.data.warehouse);
        const firstZone = res.data.warehouse.zones?.[0];
        if (firstZone) {
          setAisleData((prev) => ({ ...prev, zone_id: firstZone.id }));
          const firstAisle = firstZone.aisles?.[0];
          if (firstAisle) {
            setRackData((prev) => ({ ...prev, aisle_id: firstAisle.id }));
            const firstRack = firstAisle.racks?.[0];
            if (firstRack && firstRack.levels?.[0]) {
              setLocationData((prev) => ({ ...prev, level_id: firstRack.levels[0].id }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error cargando árbol espacial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) fetchTree(selectedWarehouseId);
  }, [selectedWarehouseId]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!zoneData.name.trim()) return;

    try {
      await apiFetch('/locations/zones', {
        method: 'POST',
        body: JSON.stringify({ ...zoneData, warehouse_id: selectedWarehouseId }),
      });
      setMessage({ type: 'success', text: 'Zona creada exitosamente' });
      setZoneData({ name: '', turnover_rate: 'HIGH' });
      fetchTree(selectedWarehouseId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear zona' });
    }
  };

  const handleCreateAisle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!aisleData.name.trim() || !aisleData.zone_id) return;

    try {
      await apiFetch('/locations/aisles', {
        method: 'POST',
        body: JSON.stringify(aisleData),
      });
      setMessage({ type: 'success', text: 'Pasillo creado exitosamente' });
      setAisleData({ ...aisleData, name: '' });
      fetchTree(selectedWarehouseId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear pasillo' });
    }
  };

  const handleCreateRack = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!rackData.code.trim() || !rackData.aisle_id) return;

    try {
      await apiFetch('/locations/racks', {
        method: 'POST',
        body: JSON.stringify(rackData),
      });
      setMessage({ type: 'success', text: 'Repisa 2D creada exitosamente' });
      setRackData({ ...rackData, code: '' });
      fetchTree(selectedWarehouseId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear repisa 2D' });
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!locationData.code.trim() || !locationData.level_id) return;

    try {
      await apiFetch('/locations/storage-locations', {
        method: 'POST',
        body: JSON.stringify(locationData),
      });
      setMessage({ type: 'success', text: 'Casillero creado exitosamente' });
      setLocationData({ ...locationData, code: '' });
      fetchTree(selectedWarehouseId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear casillero' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Grid size={24} color="var(--primary)" />
            Diseñador de Jerarquía Espacial de Bodega
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Estructura Zonas, Pasillos, Repisas 2D con coordenadas en cuadrícula y Casilleros de almacenamiento.
          </p>
        </div>

        {/* Warehouse Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Bodega a Editar:</label>
          <select
            className="input"
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            style={{ minWidth: '220px', padding: '8px 12px' }}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>

          <button onClick={() => fetchTree(selectedWarehouseId)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs for Designer Step */}
      <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('zone')}
          className={`btn ${activeTab === 'zone' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          1. Crear Zona
        </button>
        <button
          onClick={() => setActiveTab('aisle')}
          className={`btn ${activeTab === 'aisle' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          2. Crear Pasillo
        </button>
        <button
          onClick={() => setActiveTab('rack')}
          className={`btn ${activeTab === 'rack' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          3. Crear Repisa 2D
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`btn ${activeTab === 'location' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          4. Crear Casillero
        </button>
      </div>

      {/* Form Panels by Tab */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {activeTab === 'zone' && (
          <form onSubmit={handleCreateZone} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>Añadir Zona de Almacenamiento</h3>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nombre de la Zona *</label>
              <input
                type="text"
                className="input"
                placeholder="ej. Zona A - Alta Rotación (Secos)"
                value={zoneData.name}
                onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Tasa de Rotación *</label>
              <select
                className="input"
                value={zoneData.turnover_rate}
                onChange={(e) => setZoneData({ ...zoneData, turnover_rate: e.target.value as any })}
                style={{ width: '100%' }}
              >
                <option value="HIGH">HIGH — Alta Rotación (Frenético)</option>
                <option value="MEDIUM">MEDIUM — Rotación Media</option>
                <option value="LOW">LOW — Baja Rotación (Almacenamiento Larga Estancia)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Guardar Zona
            </button>
          </form>
        )}

        {activeTab === 'aisle' && (
          <form onSubmit={handleCreateAisle} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>Añadir Pasillo</h3>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Zona Perteneciente *</label>
              <select
                className="input"
                value={aisleData.zone_id}
                onChange={(e) => setAisleData({ ...aisleData, zone_id: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">Seleccionar Zona...</option>
                {warehouseTree?.zones?.map((z: any) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.turnover_rate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nombre del Pasillo *</label>
              <input
                type="text"
                className="input"
                placeholder="ej. Pasillo 01"
                value={aisleData.name}
                onChange={(e) => setAisleData({ ...aisleData, name: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Guardar Pasillo
            </button>
          </form>
        )}

        {activeTab === 'rack' && (
          <form onSubmit={handleCreateRack} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>Añadir Repisa con Coordenadas 2D</h3>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Pasillo Perteneciente *</label>
              <select
                className="input"
                value={rackData.aisle_id}
                onChange={(e) => setRackData({ ...rackData, aisle_id: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">Seleccionar Pasillo...</option>
                {warehouseTree?.zones?.flatMap((z: any) =>
                  z.aisles?.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {z.name} ➔ {a.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Código de la Repisa *</label>
              <input
                type="text"
                className="input"
                placeholder="ej. REP-A1"
                value={rackData.code}
                onChange={(e) => setRackData({ ...rackData, code: e.target.value.toUpperCase() })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Posición X en Plano</label>
                <input
                  type="number"
                  className="input"
                  value={rackData.position_x}
                  onChange={(e) => setRackData({ ...rackData, position_x: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Posición Y en Plano</label>
                <input
                  type="number"
                  className="input"
                  value={rackData.position_y}
                  onChange={(e) => setRackData({ ...rackData, position_y: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Guardar Repisa 2D
            </button>
          </form>
        )}

        {activeTab === 'location' && (
          <form onSubmit={handleCreateLocation} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>Añadir Casillero en Nivel</h3>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nivel de Repisa *</label>
              <select
                className="input"
                value={locationData.level_id}
                onChange={(e) => setLocationData({ ...locationData, level_id: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">Seleccionar Nivel...</option>
                {warehouseTree?.zones?.flatMap((z: any) =>
                  z.aisles?.flatMap((a: any) =>
                    a.racks?.flatMap((r: any) =>
                      r.levels?.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {r.code} ➔ Nivel {l.level_number}
                        </option>
                      ))
                    )
                  )
                )}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Código del Casillero *</label>
              <input
                type="text"
                className="input"
                placeholder="ej. A1-N1-POS1"
                value={locationData.code}
                onChange={(e) => setLocationData({ ...locationData, code: e.target.value.toUpperCase() })}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Volumen Total (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={locationData.total_volume_m3}
                  onChange={(e) => setLocationData({ ...locationData, total_volume_m3: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Peso Máximo (kg)</label>
                <input
                  type="number"
                  className="input"
                  value={locationData.max_weight_kg}
                  onChange={(e) => setLocationData({ ...locationData, max_weight_kg: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Guardar Casillero
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
