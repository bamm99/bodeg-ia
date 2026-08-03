import React, { useState } from 'react';
import { Building2, ArrowRight, ArrowLeft, CheckCircle, Crown, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header Stepper */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Alta de Nueva Empresa Client</h2>
              <p className="text-xs text-slate-400">Paso {step} de 3 — Configuración Multi-Tenant</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-7 h-1.5 rounded-full transition-colors ${
                  s === step
                    ? 'bg-emerald-500'
                    : s < step
                    ? 'bg-emerald-500/40'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Datos de la Empresa */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Razón Social / Nombre Comercial *
              </label>
              <input
                type="text"
                placeholder="Ej: Distribuidora Agrosur SpA"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RUT Empresa * (Chileno)
                </label>
                <input
                  type="text"
                  placeholder="76.543.210-K"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dirección Matriz / Casa Matriz
              </label>
              <input
                type="text"
                placeholder="Av. Américo Vespucio 1500, Pudahuel"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleNextStep1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Siguiente: Seleccionar Plan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Selección de Plan */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Selecciona el plan contratado para la empresa:</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'BASIC', label: 'Básico', limits: '1 Bodega • 5 User • 500m³' },
                { name: 'PRO', label: 'Profesional', limits: '5 Bodegas • 25 User • 2.500m³' },
                { name: 'ENTERPRISE', label: 'Enterprise', limits: 'Ilimitado • 100 User • 10.000m³' },
              ].map((p) => (
                <div
                  key={p.name}
                  onClick={() => setSelectedPlanName(p.name)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedPlanName === p.name
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Crown className="w-5 h-5 mb-2" />
                  <h3 className="font-bold text-sm text-slate-200">{p.label}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{p.limits}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Siguiente: Administrador Initial
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Administrador Inicial */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre Completo del Administrador *
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez Morales"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email de Registro (Login) *
              </label>
              <input
                type="email"
                placeholder="admin@empresa.cl"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña Inicial *
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20"
              >
                {loading ? 'Registrando...' : 'Finalizar & Crear Empresa'}
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
