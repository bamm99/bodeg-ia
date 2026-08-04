import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { apiFetch } from '../config/api';

export const ASTFormulaEditorView: React.FC = () => {
  const [formula, setFormula] = useState('(base * turnover + maintenance + energy) * seasonal');
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedVariables = [
    { code: 'base', desc: 'Tarifa base diaria por m³ ($)' },
    { code: 'turnover', desc: 'Multiplicador por tasa de rotación' },
    { code: 'maintenance', desc: 'Costo diario de mantenimiento ($)' },
    { code: 'energy', desc: 'Costo diario de energía / frío ($)' },
    { code: 'seasonal', desc: 'Factor de estacionalidad (alta/baja)' },
    { code: 'occupied_m3', desc: 'Volumen m³ ocupado por la carga' },
    { code: 'total_m3', desc: 'Volumen total m³ del espacio' },
    { code: 'occupancy_pct', desc: 'Porcentaje de ocupación espacio' },
  ];

  const handleValidateFormula = async () => {
    setError(null);
    setValidationResult(null);

    try {
      setLoading(true);
      const res = await apiFetch('/costs/validate-formula', {
        method: 'POST',
        body: JSON.stringify({ formula }),
      });
      setValidationResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Error de sintaxis en la fórmula AST');
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (code: string) => {
    setFormula((prev) => `${prev} ${code}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={24} color="var(--primary)" />
          Editor Sintáctico de Fórmulas Dinámicas AST
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Diseña expresiones algebraicas de cobro sin código (evaluadas mediante AST Sandbox Mathjs Whitelist).
        </p>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Editor Box */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            Expresión Matemática AST
          </h3>

          <div>
            <textarea
              className="input"
              rows={4}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                padding: '12px',
              }}
              placeholder="Ingresa la expresión matemática..."
            />
          </div>

          <button onClick={handleValidateFormula} className="btn btn-primary" style={{ width: '100%' }}>
            <Play size={16} />
            <span>{loading ? 'Validando Árbol AST...' : 'Validar Sintaxis con Sandbox Whitelist'}</span>
          </button>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {validationResult && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CheckCircle2 size={18} />
                <span>¡Fórmula AST Válida y Segura!</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Verificada correctamente contra el entorno aislado Mathjs Sandbox.
              </p>
            </div>
          )}
        </div>

        {/* Whitelist Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--warning)" />
            Variables Permitidas (Sandbox Whitelist)
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Haz clic en cualquier variable para insertarla directamente en el editor:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allowedVariables.map((v) => (
              <div
                key={v.code}
                onClick={() => insertVariable(v.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {v.code}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '10px' }}>{v.desc}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>+ Insertar</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
