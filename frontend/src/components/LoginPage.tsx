import React, { useState } from 'react';
import { Cpu, Lock, Mail, AlertCircle, ArrowLeft, KeyRound, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface LoginPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding, onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@bodegia.cl');
  const [password, setPassword] = useState<string>('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar sesión. Verifique sus credenciales.');
      }

      // Guardar sesión en el AuthContext
      login(data.data.accessToken, data.data.user);
      setLoading(false);
      onLoginSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Error de conexión con el servidor de autenticación.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleSelectUser = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('admin123');
  };

  const handleQuickLogin = async () => {
    await executeLogin(email, 'admin123');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Volver a la Landing */}
      <button
        onClick={onBackToLanding}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          padding: '10px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
        }}
      >
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '36px' }}>
        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            className="glow-pulse"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Cpu size={26} color="#070a11" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Bodeg<span className="gradient-text">-IA</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Ingresa tus credenciales para acceder a la plataforma
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        {/* Formulario Estándar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Correo Electrónico:
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@bodegia.cl"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: '#0d131f',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Contraseña:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: '#0d131f',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              color: '#070a11',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
            }}
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Selector de Cuentas Reales del Seeder */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <KeyRound size={14} color="var(--primary)" />
            <span>Usuarios de Prueba (Seeder):</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select
              className="input"
              value={email}
              onChange={(e) => handleSelectUser(e.target.value)}
              style={{
                width: '100%',
                background: '#0d131f',
                border: '1px solid var(--border-color)',
                color: '#fff',
                padding: '10px 12px',
                fontSize: '0.82rem',
                borderRadius: '8px',
              }}
            >
              <optgroup label="👑 Plataforma SaaS Global">
                <option value="admin@bodegia.cl">👑 Super Admin Global — admin@bodegia.cl</option>
                <option value="ejecutivo@bodegia.cl">💼 Ejecutivo de Cuenta (Felipe Soto) — ejecutivo@bodegia.cl</option>
              </optgroup>

              <optgroup label="🏢 AgroSur S.A. (Empresa Client 1)">
                <option value="admin.agrosur@bodegia.cl">🏢 Admin Empresa (Sebastián Morales) — admin.agrosur@bodegia.cl</option>
                <option value="jefe.pudahuel@bodegia.cl">📦 Jefe Bodega Pudahuel (Carlos Mendoza) — jefe.pudahuel@bodegia.cl</option>
                <option value="operador.pudahuel@bodegia.cl">🚜 Operador Bodega (Rodrigo Silva) — operador.pudahuel@bodegia.cl</option>
                <option value="comercial.agrosur@bodegia.cl">📊 Gestión Comercial (Andrea Tapia) — comercial.agrosur@bodegia.cl</option>
                <option value="cliente.frutas@bodegia.cl">👁️ Cliente 3PL (Frutas Cachapoal) — cliente.frutas@bodegia.cl</option>
              </optgroup>

              <optgroup label="🏢 ElectroChile S.A. (Empresa Client 2)">
                <option value="admin.electro@bodegia.cl">🏢 Admin Empresa (Valeria Fuentealba) — admin.electro@bodegia.cl</option>
                <option value="jefe.huechuraba@bodegia.cl">📦 Jefe Bodega Huechuraba (Matías Tapia) — jefe.huechuraba@bodegia.cl</option>
                <option value="comercial.electro@bodegia.cl">📊 Gestión Comercial (Camilo Lagos) — comercial.electro@bodegia.cl</option>
                <option value="cliente.tech@bodegia.cl">👁️ Cliente 3PL (Retail Tech) — cliente.tech@bodegia.cl</option>
              </optgroup>

              <optgroup label="🏢 Distribuidora Austral">
                <option value="admin.austral@bodegia.cl">🏢 Admin Empresa (Gonzalo Araya) — admin.austral@bodegia.cl</option>
                <option value="jefe.nos@bodegia.cl">📦 Jefe Bodega Nos (Loreto Sepúlveda) — jefe.nos@bodegia.cl</option>
              </optgroup>

              <optgroup label="🏢 Textil Maipú & Químicos Industriales">
                <option value="admin.textil@bodegia.cl">🏢 Admin Textil Maipú (Camila Benítez) — admin.textil@bodegia.cl</option>
                <option value="admin.quimicos@bodegia.cl">🏢 Admin Químicos (Ignacio Villagra) — admin.quimicos@bodegia.cl</option>
                <option value="jefe.lampa@bodegia.cl">📦 Jefe Bodega Lampa (Esteban Paredes) — jefe.lampa@bodegia.cl</option>
              </optgroup>
            </select>

            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                fontSize: '0.82rem',
                justifyContent: 'center',
                padding: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)',
              }}
            >
              <Zap size={16} />
              <span>{loading ? 'Iniciando Sesión...' : '⚡ Iniciar Sesión Rápido con este Usuario'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
