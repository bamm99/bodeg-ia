import React, { useState, useEffect } from 'react';
import { Layers, Box, Info, RefreshCw, Warehouse, Activity, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../config/api';

interface StorageLocation {
  id: string;
  code: string;
  total_volume_m3: number;
  occupied_volume_m3: number;
  status: string;
  inventory_items?: any[];
}

interface Level {
  id: string;
  level_number: number;
  storage_locations: StorageLocation[];
}

interface RackGridItem {
  id: string;
  code: string;
  zoneName: string;
  turnoverRate: 'HIGH' | 'MEDIUM' | 'LOW';
  positionX: number;
  positionY: number;
  widthUnits: number;
  lengthUnits: number;
  totalVolumeM3: number;
  occupiedVolumeM3: number;
  occupancyPct: number;
  heatStatus: 'AVAILABLE' | 'PARTIAL' | 'FULL';
  locationsCount: number;
  levels: Level[];
}

interface WarehouseMetrics {
  totalVolumeM3: number;
  occupiedVolumeM3: number;
  availableVolumeM3: number;
  occupancyPct: number;
  racksCount: number;
}

export const WarehouseMap2D: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [warehouseData, setWarehouseData] = useState<{
    warehouseName: string;
    warehouseCode: string;
    branchName: string;
    metrics: WarehouseMetrics;
    racksGrid: RackGridItem[];
  } | null>(null);

  const [selectedRack, setSelectedRack] = useState<RackGridItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Cargar lista de bodegas asignadas/disponibles
  const loadWarehousesList = async () => {
    try {
      const res = await apiFetch('/locations/my-assigned-warehouses');
      if (res.data && res.data.length > 0) {
        setWarehouses(res.data);
        setSelectedWarehouseId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando lista de bodegas:', err);
    }
  };

  // 2. Cargar grilla y mapa 2D de la bodega seleccionada
  const fetch2DMap = async (whId: string) => {
    if (!whId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/locations/warehouses/${whId}/2d-map`);
      if (res.data) {
        setWarehouseData(res.data);
        if (res.data.racksGrid && res.data.racksGrid.length > 0) {
          setSelectedRack(res.data.racksGrid[0]);
        } else {
          setSelectedRack(null);
        }
      }
    } catch (err) {
      console.error('Error al obtener mapa 2D:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehousesList();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetch2DMap(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const getHeatmapStyle = (occupancyPct: number, isSelected: boolean) => {
    let bg = 'rgba(16, 185, 129, 0.22)';
    let border = '#10b981';

    if (occupancyPct >= 90) {
      bg = 'rgba(239, 68, 68, 0.35)';
      border = '#ef4444';
    } else if (occupancyPct >= 50) {
      bg = 'rgba(245, 158, 11, 0.35)';
      border = '#f59e0b';
    }

    return {
      bg,
      border: isSelected ? '#38bdf8' : border,
      boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.7)' : 'none',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Selector & Summary */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={24} color="var(--primary)" />
            Plano Interactivo 2D & Mapa de Calor de Bodega
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Inspección espacial de repisas 2D, casilleros y porcentaje de ocupación en tiempo real.
          </p>
        </div>

        {/* Warehouse Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Warehouse size={16} color="var(--primary)" />
            Bodega Activa:
          </label>
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

          <button onClick={() => fetch2DMap(selectedWarehouseId)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      {warehouseData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={28} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ocupación Global</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: warehouseData.metrics.occupancyPct >= 90 ? '#ef4444' : '#10b981' }}>
                {warehouseData.metrics.occupancyPct}%
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Box size={28} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volumen Ocupado</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {warehouseData.metrics.occupiedVolumeM3} m³ / {warehouseData.metrics.totalVolumeM3} m³
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={28} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacidad Disponible</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
                {warehouseData.metrics.availableVolumeM3} m³
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas & Details Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* 2D Canvas Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Disposición 2D de Repisas ({warehouseData?.racksGrid.length || 0} Repisas)
            </h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> &lt;50% (Disponible)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> 50-89% (Medio)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> &ge;90% (Casi Lleno)
              </span>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '440px',
              background: '#0d131f',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              padding: '16px',
              overflowX: 'auto',
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '380px', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ marginRight: '8px' }} />
                Cargando mapa 2D...
              </div>
            ) : warehouseData?.racksGrid.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '100px' }}>
                <Info size={36} style={{ marginBottom: '12px' }} />
                <p>Esta bodega aún no tiene repisas configuradas en el diseñador espacial.</p>
              </div>
            ) : (
              warehouseData?.racksGrid.map((rack) => {
                const isSelected = selectedRack?.id === rack.id;
                const { bg, border, boxShadow } = getHeatmapStyle(rack.occupancyPct, isSelected);
                const gridScale = 36;

                return (
                  <div
                    key={rack.id}
                    onClick={() => setSelectedRack(rack)}
                    style={{
                      position: 'absolute',
                      left: `${rack.positionX * gridScale}px`,
                      top: `${rack.positionY * gridScale}px`,
                      width: `${rack.widthUnits * gridScale}px`,
                      height: `${rack.lengthUnits * gridScale}px`,
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow,
                      transition: 'all 0.2s ease',
                      padding: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{rack.code}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {rack.occupancyPct}% Vol
                    </div>
                    <span
                      className={`badge badge-${rack.turnoverRate.toLowerCase()}`}
                      style={{ fontSize: '0.6rem', padding: '2px 6px', marginTop: '4px' }}
                    >
                      {rack.turnoverRate}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rack Detail Inspector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {selectedRack ? (
            <div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {selectedRack.code}
                  </h3>
                  <span className={`badge badge-${selectedRack.turnoverRate.toLowerCase()}`}>
                    Rotación {selectedRack.turnoverRate}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedRack.zoneName}
                </p>
              </div>

              {/* Occupancy Indicator */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ocupación de Repisa</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{selectedRack.occupancyPct}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${selectedRack.occupancyPct}%`,
                      height: '100%',
                      background: selectedRack.occupancyPct >= 90 ? '#ef4444' : selectedRack.occupancyPct >= 50 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Volumen: {selectedRack.occupiedVolumeM3} m³</span>
                  <span>Capacidad: {selectedRack.totalVolumeM3} m³</span>
                </div>
              </div>

              {/* Levels & Locations List */}
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                Niveles y Casilleros ({selectedRack.levels?.length || 0} Niveles)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {selectedRack.levels?.map((lvl) => (
                  <div key={lvl.id} style={{ background: '#0d131f', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                      Nivel {lvl.level_number}
                    </div>

                    {lvl.storage_locations?.map((loc) => (
                      <div key={loc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '6px 8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600 }}>
                          <Box size={14} color="var(--primary)" />
                          {loc.code}
                        </span>
                        <span>
                          <strong>{loc.occupied_volume_m3}</strong> / {loc.total_volume_m3} m³
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '60px' }}>
              <Info size={32} style={{ marginBottom: '12px' }} />
              <p>Selecciona una repisa en el plano 2D para inspeccionar casilleros e inventario.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
