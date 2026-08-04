import React, { useState } from 'react';
import { Calculator, Play, FileText } from 'lucide-react';
import { apiFetch } from '../config/api';

export const CostSimulatorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulate' | 'billing'>('simulate');

  // Simulation Form State
  const [simForm, setSimForm] = useState({
    daily_base_cost: 150.0,
    turnover_multiplier: 1.2,
    maintenance_cost_daily: 20.0,
    energy_cost_daily: 15.0,
    seasonal_factor: 1.0,
    occupied_volume_m3: 45.0,
    total_volume_m3: 100.0,
    custom_formula_expression: '',
  });

  const [simResult, setSimResult] = useState<any | null>(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Billing Engine Form State
  const [billForm, setBillForm] = useState({
    client_id: '',
    start_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    end_date: new Date().toISOString().substring(0, 10),
  });

  const [billResult, setBillResult] = useState<any | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);

  const handleSimulate = async () => {
    try {
      setLoadingSim(true);
      const res = await apiFetch('/costs/simulate', {
        method: 'POST',
        body: JSON.stringify(simForm),
      });
      setSimResult(res.data);
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar simulación de costos');
    } finally {
      setLoadingSim(false);
    }
  };

  const handleCalculateBilling = async () => {
    try {
      setLoadingBill(true);
      const res = await apiFetch('/costs/billing/calculate-period', {
        method: 'POST',
        body: JSON.stringify(billForm),
      });
      setBillResult(res.data);
    } catch (err: any) {
      alert(err.message || 'Error al generar liquidación de periodo');
    } finally {
      setLoadingBill(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={24} color="var(--primary)" />
          Simulador de Costos & Motor de Liquidación 3PL
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Cotiza en tiempo real costos de ocupación de almacenamiento m³/día o genera liquidaciones mensuales para clientes 3PL.
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('simulate')}
          className={`btn ${activeTab === 'simulate' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          1. Simulación Instantánea en Memoria
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`btn ${activeTab === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          2. Motor de Liquidación de Periodo 3PL
        </button>
      </div>

      {/* Tab 1: Instant Simulation */}
      {activeTab === 'simulate' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Parámetros de Cotización
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volumen Ocupado (m³)</label>
                <input
                  type="number"
                  className="input"
                  value={simForm.occupied_volume_m3}
                  onChange={(e) => setSimForm({ ...simForm, occupied_volume_m3: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volumen Total (m³)</label>
                <input
                  type="number"
                  className="input"
                  value={simForm.total_volume_m3}
                  onChange={(e) => setSimForm({ ...simForm, total_volume_m3: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarifa Base ($/m³-día)</label>
                <input
                  type="number"
                  className="input"
                  value={simForm.daily_base_cost}
                  onChange={(e) => setSimForm({ ...simForm, daily_base_cost: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mult. Rotación</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={simForm.turnover_multiplier}
                  onChange={(e) => setSimForm({ ...simForm, turnover_multiplier: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button onClick={handleSimulate} className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Play size={16} />
              <span>{loadingSim ? 'Calculando...' : 'Calcular Simulación'}</span>
            </button>
          </div>

          {/* Results Box */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
                Resultado de la Cotización
              </h3>

              {simResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Costo Diario Estimado por Ocupación</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                      ${simResult.totalDailyCost.toLocaleString('es-CL')} CLP / día
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Porcentaje Ocupación</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {simResult.occupancyPct}%
                      </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Costo Estimado Mensual (30d)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                        ${(simResult.totalDailyCost * 30).toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Ingresa los parámetros y presiona <strong>Calcular Simulación</strong> para ver los resultados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Billing Calculation */}
      {activeTab === 'billing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Generación de Liquidación 3PL
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha Inicio *</label>
                <input
                  type="date"
                  className="input"
                  value={billForm.start_date}
                  onChange={(e) => setBillForm({ ...billForm, start_date: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha Fin *</label>
                <input
                  type="date"
                  className="input"
                  value={billForm.end_date}
                  onChange={(e) => setBillForm({ ...billForm, end_date: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button onClick={handleCalculateBilling} className="btn btn-primary" style={{ marginTop: '8px' }}>
              <FileText size={16} />
              <span>{loadingBill ? 'Calculando Periodo...' : 'Liquidación de Periodo 3PL'}</span>
            </button>
          </div>

          {/* Billing Result Box */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
                Resumen de Facturación
              </h3>

              {billResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#0d131f', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto Total a Facturar ({billResult.totalDays} Días)</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                      ${billResult.periodTotalCostCLP.toLocaleString('es-CL')} {billResult.currency}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Volumen Total m³</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {billResult.totalOccupiedM3} m³
                      </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Costo Diario Total</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                        ${billResult.dailyStorageCostTotal.toLocaleString('es-CL')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Selecciona el rango de fechas y presiona <strong>Liquidación de Periodo 3PL</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
