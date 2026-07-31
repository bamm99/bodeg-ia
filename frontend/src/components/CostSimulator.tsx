import React, { useState } from 'react';
import { Calculator, Sliders, ShieldCheck, Play } from 'lucide-react';

export const CostSimulator: React.FC = () => {
  const [dailyBaseCost, setDailyBaseCost] = useState<number>(1500);
  const [turnoverMult, setTurnoverMult] = useState<number>(1.5);
  const [maintenanceCost, setMaintenanceCost] = useState<number>(200);
  const [energyCost, setEnergyCost] = useState<number>(0);
  const [seasonalFactor, setSeasonalFactor] = useState<number>(1.0);
  const [occupiedVol, setOccupiedVol] = useState<number>(2.0);
  const [totalVol, setTotalVol] = useState<number>(2.5);

  const [customFormula, setCustomFormula] = useState<string>(
    '(base * turnover + maintenance + energy) * seasonal'
  );
  const [simulationResult, setSimulationResult] = useState<number | null>(null);

  const handleSimulate = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/costs/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_base_cost: dailyBaseCost,
          turnover_multiplier: turnoverMult,
          maintenance_cost_daily: maintenanceCost,
          energy_cost_daily: energyCost,
          seasonal_factor: seasonalFactor,
          occupied_volume_m3: occupiedVol,
          total_volume_m3: totalVol,
          custom_formula_expression: customFormula,
        }),
      });

      const data = await res.json();
      if (data.simulationResult) {
        setSimulationResult(data.simulationResult.totalDailyCost);
      }
    } catch (err) {
      console.error('Error al simular costo:', err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Configuration Inputs */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={20} color="var(--primary)" />
          Parámetros del Perfil de Costos por Repisa/Zona
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Costo Base Diario ($ CLP):
            </label>
            <input
              type="number"
              value={dailyBaseCost}
              onChange={(e) => setDailyBaseCost(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Multiplicador de Rotación:
            </label>
            <input
              type="number"
              step="0.1"
              value={turnoverMult}
              onChange={(e) => setTurnoverMult(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Mantenimiento Diario ($ CLP):
            </label>
            <input
              type="number"
              value={maintenanceCost}
              onChange={(e) => setMaintenanceCost(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Costo Energético/Frío ($ CLP):
            </label>
            <input
              type="number"
              value={energyCost}
              onChange={(e) => setEnergyCost(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Factor Estacional (Multiplicador):
            </label>
            <input
              type="number"
              step="0.1"
              value={seasonalFactor}
              onChange={(e) => setSeasonalFactor(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Volumen Ocupado (m³):
            </label>
            <input
              type="number"
              step="0.1"
              value={occupiedVol}
              onChange={(e) => setOccupiedVol(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Volumen Total (m³):
            </label>
            <input
              type="number"
              step="0.1"
              value={totalVol}
              onChange={(e) => setTotalVol(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>
        </div>

        {/* Dynamic Formula Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <ShieldCheck size={14} />
            Fórmula Dinámica Personalizada (Evaluación AST Segura Sandbox):
          </label>
          <input
            type="text"
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#0d131f',
              border: '1px solid var(--border-accent)',
              borderRadius: '8px',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
            }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Variables disponibles: <code>base</code>, <code>turnover</code>, <code>maintenance</code>, <code>energy</code>, <code>seasonal</code>, <code>occupied_m3</code>, <code>occupancy_pct</code>
          </p>
        </div>

        <button
          onClick={handleSimulate}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            color: '#090d16',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
          }}
        >
          <Play size={18} />
          Calcular y Simular Tarifa Diaria
        </button>
      </div>

      {/* Output Simulation Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Calculator size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Resultado de Simulación de Tarifa
        </h3>

        {simulationResult !== null ? (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
              ${simulationResult.toLocaleString('es-CL')} <span style={{ fontSize: '1rem', color: 'var(--primary)' }}>CLP / día</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '8px' }}>
              Proyección Mensual (30 días): ${ (simulationResult * 30).toLocaleString('es-CL') } CLP
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            Presiona &quot;Calcular y Simular Tarifa Diaria&quot; para ejecutar el motor de cálculo AST.
          </p>
        )}
      </div>
    </div>
  );
};
