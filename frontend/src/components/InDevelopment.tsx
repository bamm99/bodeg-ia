import React from 'react';
import { ArrowLeft, Construction, Sparkles } from 'lucide-react';

interface InDevelopmentProps {
  sectionTitle: string;
  onBackToDashboard: () => void;
}

export const InDevelopment: React.FC<InDevelopmentProps> = ({ sectionTitle, onBackToDashboard }) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        maxWidth: '720px',
        margin: '40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="glow-pulse"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <Construction size={32} color="#f59e0b" />
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
        <Sparkles size={12} /> Módulo en Construcción
      </span>

      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>
        Sección &quot;{sectionTitle}&quot; en Desarrollo
      </h2>

      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '32px' }}>
        Esta funcionalidad está siendo integrada activamente con los endpoints REST v1 del backend. Pronto estará disponible con métricas e interacción completa.
      </p>

      <button
        onClick={onBackToDashboard}
        style={{
          padding: '12px 24px',
          borderRadius: '10px',
          border: 'none',
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
          color: '#070a11',
          fontWeight: 800,
          fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
        }}
      >
        <ArrowLeft size={18} />
        Volver al Dashboard Principal
      </button>
    </div>
  );
};
