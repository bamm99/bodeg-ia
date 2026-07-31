import React, { useState } from 'react';
import { Cpu, Lock, Mail, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
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

      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
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
            Ingresa tus credenciales para acceder al Dashboard
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

        {/* Formulario */}
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
              marginTop: '8px',
              padding: '14px',
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

        {/* Demo Fast Access Pills por Rol */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
            <KeyRound size={14} /> Seleccionar Rol Demo (Clave: admin123):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setDemoCredentials('admin@bodegia.cl')}
              style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              👑 <strong>Super Admin Global</strong> (admin@bodegia.cl)
            </button>
            <button
              onClick={() => setDemoCredentials('ejecutivo@bodegia.cl')}
              style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(129, 140, 248, 0.4)',
                background: 'rgba(129, 140, 248, 0.1)',
                color: '#818cf8',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              💼 <strong>Ejecutivo Plataforma</strong> (ejecutivo@bodegia.cl)
            </button>
            <button
              onClick={() => setDemoCredentials('admin.agrosur@bodegia.cl')}
              style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🏢 <strong>Admin Empresa Single-Tenant</strong> (admin.agrosur@bodegia.cl)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
