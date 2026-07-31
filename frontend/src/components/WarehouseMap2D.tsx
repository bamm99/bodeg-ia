import React, { useState, useEffect } from 'react';
import { Layers, DollarSign, Box, Info, RefreshCw } from 'lucide-react';

interface StorageLocation {
  id: string;
  code: string;
  total_volume_m3: number;
  occupied_volume_m3: number;
  status: string;
}

interface Level {
  id: string;
  level_number: number;
  total_volume_m3: number;
  storage_locations: StorageLocation[];
}

interface Rack {
  id: string;
  code: string;
  position_x: number;
  position_y: number;
  width_units: number;
  length_units: number;
  zone_name: string;
  turnover_rate: 'HIGH' | 'MEDIUM' | 'LOW';
  daily_base_cost: number;
  levels: Level[];
}

export const WarehouseMap2D: React.FC = () => {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      // 1. Obtener Token de Autenticación
      const authRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bodegia.cl', password: 'admin123' }),
      });
      const authData = await authRes.json();

      if (authData.token) {
        // 2. Consultar árbol jerárquico real desde PostgreSQL
        const res = await fetch('http://localhost:4000/api/warehouses/f0000000-0000-0000-0000-000000000001/tree', {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        const data = await res.json();
        if (data.warehouse && data.warehouse.zones) {
          const loadedRacks: Rack[] = [];
          data.warehouse.zones.forEach((zone: any) => {
            zone.aisles.forEach((aisle: any) => {
              aisle.racks.forEach((rack: any) => {
                loadedRacks.push({
                  id: rack.id,
                  code: rack.code,
                  position_x: rack.position_x || 1,
                  position_y: rack.position_y || 1,
                  width_units: rack.width_units || 3,
                  length_units: rack.length_units || 2,
                  zone_name: zone.name,
                  turnover_rate: zone.turnover_rate || 'MEDIUM',
                  daily_base_cost: zone.cost_profiles?.[0]?.daily_base_cost ? Number(zone.cost_profiles[0].daily_base_cost) : 2000,
                  levels: rack.levels || [],
                });
              });
            });
          });

          if (loadedRacks.length > 0) {
            setRacks(loadedRacks);
            setSelectedRack(loadedRacks[0]);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Usando estructura de demostración local:', err);
    }

    // Fallback de demostración
    const demoRacks: Rack[] = [
      {
        id: 'rack-1',
        code: 'REP-A1',
        position_x: 1,
        position_y: 1,
        width_units: 3,
        length_units: 2,
        zone_name: 'Zona A - Alta Rotación (Secos)',
        turnover_rate: 'HIGH',
        daily_base_cost: 2000,
        levels: [
          {
            id: 'lev-1',
            level_number: 1,
            total_volume_m3: 4.5,
            storage_locations: [
              { id: 'loc-1', code: 'A1-N1-POS1', total_volume_m3: 4.5, occupied_volume_m3: 3.8, status: 'PARTIAL' },
              { id: 'loc-2', code: 'A1-N1-POS2', total_volume_m3: 4.5, occupied_volume_m3: 2.0, status: 'PARTIAL' },
            ],
          },
        ],
      },
      {
        id: 'rack-2',
        code: 'REP-A2',
        position_x: 5,
        position_y: 1,
        width_units: 3,
        length_units: 2,
        zone_name: 'Zona A - Alta Rotación (Secos)',
        turnover_rate: 'HIGH',
        daily_base_cost: 2000,
        levels: [
          {
            id: 'lev-2',
            level_number: 1,
            total_volume_m3: 4.5,
            storage_locations: [
              { id: 'loc-3', code: 'A2-N1-POS1', total_volume_m3: 4.5, occupied_volume_m3: 0.5, status: 'AVAILABLE' },
            ],
          },
        ],
      },
      {
        id: 'rack-3',
        code: 'REP-F1',
        position_x: 1,
        position_y: 5,
        width_units: 4,
        length_units: 2,
        zone_name: 'Zona Fría - Congelados Premium',
        turnover_rate: 'MEDIUM',
        daily_base_cost: 3000,
        levels: [
          {
            id: 'lev-3',
            level_number: 1,
            total_volume_m3: 6.0,
            storage_locations: [
              { id: 'loc-4', code: 'F1-N1-POS1', total_volume_m3: 6.0, occupied_volume_m3: 5.5, status: 'FULL' },
            ],
          },
        ],
      },
    ];

    setRacks(demoRacks);
    setSelectedRack(demoRacks[0]);
    setLoading(false);
  };

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const getRackStyle = (rack: Rack) => {
    let totalVol = 0;
    let occVol = 0;
    rack.levels.forEach((l) => {
      l.storage_locations?.forEach((loc) => {
        totalVol += Number(loc.total_volume_m3 || 0);
        occVol += Number(loc.occupied_volume_m3 || 0);
      });
    });

    const ratio = totalVol > 0 ? occVol / totalVol : 0;
    let bg = 'rgba(16, 185, 129, 0.25)';
    let border = '#10b981';

    if (ratio > 0.8) {
      bg = 'rgba(239, 68, 68, 0.3)';
      border = '#ef4444';
    } else if (ratio > 0.4) {
      bg = 'rgba(245, 158, 11, 0.3)';
      border = '#f59e0b';
    }

    return { bg, border, ratio: (ratio * 100).toFixed(0) };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      {/* 2D Map Grid Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--primary)" />
              Plano Interactivo 2D de Bodega Principal Pudahuel
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Haz clic en cualquier repisa para inspeccionar casilleros, volumen ocupado y tarifas activas
            </p>
          </div>

          <button
            onClick={fetchWarehouseData}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar Plano
          </button>
        </div>

        {/* Canvas Layout Grid */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '420px',
            background: '#0d131f',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundImage:
              'radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            padding: '16px',
            overflow: 'hidden',
          }}
        >
          {racks.map((rack) => {
            const { bg, border, ratio } = getRackStyle(rack);
            const isSelected = selectedRack?.id === rack.id;
            const gridUnitSize = 40;

            return (
              <div
                key={rack.id}
                onClick={() => setSelectedRack(rack)}
                style={{
                  position: 'absolute',
                  left: `${rack.position_x * gridUnitSize}px`,
                  top: `${rack.position_y * gridUnitSize}px`,
                  width: `${rack.width_units * gridUnitSize}px`,
                  height: `${rack.length_units * gridUnitSize}px`,
                  background: bg,
                  border: `2px solid ${isSelected ? '#38bdf8' : border}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.6)' : 'none',
                  transition: 'all 0.2s ease',
                  padding: '4px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{rack.code}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ratio}% Vol</div>
                <span
                  className={`badge badge-${rack.turnover_rate.toLowerCase()}`}
                  style={{ fontSize: '0.6rem', padding: '2px 6px', marginTop: '4px' }}
                >
                  {rack.turnover_rate}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rack Inspector Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {selectedRack ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Detalles de {selectedRack.code}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedRack.zone_name}
                </p>
              </div>
              <span className={`badge badge-${selectedRack.turnover_rate.toLowerCase()}`}>
                Rotación {selectedRack.turnover_rate}
              </span>
            </div>

            {/* Tariff Indicator */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <DollarSign size={24} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarifa Diaria de Almacenaje</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  ${selectedRack.daily_base_cost.toLocaleString('es-CL')} CLP / día
                </div>
              </div>
            </div>

            {/* Levels List */}
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-muted)' }}>
              Niveles y Casilleros:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {selectedRack.levels.map((lvl) => (
                <div
                  key={lvl.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nivel {lvl.level_number}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vol Total: {lvl.total_volume_m3 || 4.5} m³</span>
                  </div>

                  {lvl.storage_locations?.map((loc) => (
                    <div
                      key={loc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        padding: '6px 8px',
                        background: '#0d131f',
                        borderRadius: '4px',
                        marginTop: '4px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px' }}>
            <Info size={32} style={{ marginBottom: '12px' }} />
            <p>Selecciona una repisa en el plano 2D para ver sus casilleros y costos.</p>
          </div>
        )}
      </div>
    </div>
  );
};
