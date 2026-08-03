import React, { useState } from 'react';
import { Building2, ArrowRight, ArrowLeft, CheckCircle, Crown, AlertCircle, X } from 'lucide-react';
import { apiFetch, generateIdempotencyKey } from '../config/api';

export interface CompanyCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function validateChileanRut(rutParam: string): boolean {
  if (!rutParam || typeof rutParam !== 'string') return false;
  const clean = rutParam.replace(/[^0-9kK]/g, '');
  if (clean.length < 8) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDvNum = 11 - (sum % 11);
  let expectedDv = 'K';
  if (expectedDvNum === 11) expectedDv = '0';
  else if (expectedDvNum < 10) expectedDv = expectedDvNum.toString();

  return dv === expectedDv;
}

export const CompanyCreateWizard: React.FC<CompanyCreateWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const [selectedPlanName, setSelectedPlanName] = useState('BASIC');

  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNextStep1 = () => {
    setErrorMsg('');
    if (!companyName.trim()) {
      return setErrorMsg('El nombre de la empresa es obligatorio.');
    }
    if (!validateChileanRut(taxId)) {
      return setErrorMsg('El RUT ingresado no es válido (Formato: 12.345.678-K).');
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminFullName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      return setErrorMsg('Todos los campos del usuario administrador son obligatorios.');
    }

    try {
      setLoading(true);
      await apiFetch('/auth/register-company', {
        method: 'POST',
        idempotencyKey: generateIdempotencyKey(),
        body: JSON.stringify({
          companyName,
          taxId,
          address,
          phone,
          planName: selectedPlanName,
          adminFullName,
          adminEmail,
          adminPassword,
        }),
      });

      alert('Empresa cliente y Administrador registrados con éxito.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '650px' }}>
        {/* Header Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="badge badge-primary" style={{ padding: '8px 12px', borderRadius: '12px' }}>
              <Building2 size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Alta de Nueva Empresa Cliente</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paso {step} de 3 — Configuración Multi-Tenant</p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.8rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Datos de la Empresa */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Razón Social / Nombre Comercial *
              </label>
              <input
                type="text"
                placeholder="Ej: Distribuidora Agrosur SpA"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  RUT Empresa * (Chileno)
                </label>
                <input
                  type="text"
                  placeholder="76.543.210-K"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Dirección Matriz / Casa Matriz
              </label>
              <input
                type="text"
                placeholder="Av. Américo Vespucio 1500, Pudahuel"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleNextStep1} className="btn btn-primary">
                <span>Siguiente: Seleccionar Plan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Selección de Plan */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selecciona el plan contratado para la empresa:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { name: 'BASIC', label: 'Básico', limits: '1 Bodega • 5 User • 500m³' },
                { name: 'PRO', label: 'Profesional', limits: '5 Bodegas • 25 User • 2.500m³' },
                { name: 'ENTERPRISE', label: 'Enterprise', limits: 'Ilimitado • 100 User • 10.000m³' },
              ].map((p) => (
                <div
                  key={p.name}
                  onClick={() => setSelectedPlanName(p.name)}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: selectedPlanName === p.name ? 'var(--primary)' : 'var(--border-color)',
                    background: selectedPlanName === p.name ? 'var(--primary-glow)' : 'rgba(15, 23, 42, 0.75)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Crown size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.label}</h3>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{p.limits}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                <ArrowLeft size={16} /> Atrás
              </button>
              <button type="button" onClick={handleNextStep2} className="btn btn-primary">
                <span>Siguiente: Administrador Inicial</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Administrador Inicial */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Nombre Completo del Administrador *
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez Morales"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Email de Registro (Login) *
              </label>
              <input
                type="email"
                placeholder="admin@empresa.cl"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Contraseña Inicial *
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
                <ArrowLeft size={16} /> Atrás
              </button>
              <button type="submit" disabled={loading} className="btn btn-accent">
                {loading ? 'Registrando...' : 'Finalizar & Crear Empresa'}
                <CheckCircle size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
