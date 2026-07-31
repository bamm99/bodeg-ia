import React from 'react';
import { Cpu, Layers, DollarSign, ShieldCheck, History, ArrowRight, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Top Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(7, 10, 17, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="glow-pulse"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={22} color="#070a11" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Bodeg<span className="gradient-text">-IA</span>
            </span>
          </div>

          {/* Navigation Links & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <nav style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>
                Características
              </a>
              <a href="#architecture" style={{ color: 'inherit', textDecoration: 'none' }}>
                Arquitectura
              </a>
              <a href="#benefits" style={{ color: 'inherit', textDecoration: 'none' }}>
                Beneficios
              </a>
            </nav>

            <button
              onClick={onOpenLogin}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid var(--primary)',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              Iniciar Sesión
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div className="badge badge-primary" style={{ marginBottom: '20px' }}>
          <Cpu size={14} /> Platform v1.0 — Enterprise Ready
        </div>

        <h1
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: '24px',
            maxWidth: '900px',
            margin: '0 auto 24px',
          }}
        >
          Gestión de Bodegas & Tarifario Inteligente <span className="gradient-text">Multi-Tenant</span>
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            maxWidth: '720px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Visualiza tus almacenamiento en 2D, calcula costos de repisa en tiempo real con fórmulas dinámicas AST y audita tus existencias con trazabilidad en PostgreSQL.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={onOpenLogin}
            style={{
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              color: '#070a11',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)',
            }}
          >
            Acceder al Sistema
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Potencia Operativa para la Logística Moderna</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
            Diseñado desde las bases para el modelo multi-empresa y 3PL en Chile
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div className="glass-panel glass-panel-hover" style={{ padding: '28px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Layers size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Plano 2D Interactivo</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Visualización gráfica espacial en tiempo real. Mapa de calor de ocupación en m³ y nivel de rotación de cada repisa.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ padding: '28px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(129, 140, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <DollarSign size={24} color="var(--secondary)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Tarifario AST Dinámico</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Calcula tarifas de almacenaje por día, zona o nivel. Permite fórmulas matemáticas personalizadas evaluadas de forma segura.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ padding: '28px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <ShieldCheck size={24} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Multi-Tenant RLS Nativo</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Aislamiento total de datos por empresa en PostgreSQL mediante Row-Level Security y control de acceso por roles RBAC.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ padding: '28px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <History size={24} color="var(--warning)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Kardex & Trazabilidad</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Auditoría completa de movimientos de inventario (Inbound, Relocate, Outbound) e historial de modificaciones de tarifas.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>© 2026 Bodeg-IA. Todos los derechos reservados. Plataforma Web de Gestión de Bodegas.</p>
      </footer>
    </div>
  );
};
