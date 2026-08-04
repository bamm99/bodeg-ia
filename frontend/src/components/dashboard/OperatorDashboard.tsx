import React from 'react';
import { ArrowDownRight, RefreshCw, ArrowUpRight, Grid, ShoppingCart, PackageCheck } from 'lucide-react';

interface OperatorDashboardProps {
  onNavigate: (section: string) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ onNavigate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#10b981', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '8px' }}>
          <PackageCheck size={14} /> PANTALLA OPERATIVA DE BODEGA DE TERRENO
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
          Operaciones Diarias de Stock
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Selecciona una tarea rápida para ejecutar en terreno.
        </p>
      </div>

      {/* Touch Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <button
          onClick={() => onNavigate('inbound')}
          className="glass-panel"
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'rgba(16, 185, 129, 0.05)',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownRight size={32} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>1. Recepción (Inbound)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ingresar mercancía que llega a casillero</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('relocate')}
          className="glass-panel"
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            background: 'rgba(56, 189, 248, 0.05)',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={32} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>2. Mover Mercancía</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Reubicar stock entre casilleros</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('outbound')}
          className="glass-panel"
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={32} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>3. Despacho (Outbound)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Registrar salida física de productos</p>
          </div>
        </button>
      </div>

      {/* Map & Catalog Quick Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
        <button onClick={() => onNavigate('map2d')} className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'center' }}>
          <Grid size={18} />
          <span>Ver Plano 2D de Bodega</span>
        </button>
        <button onClick={() => onNavigate('catalog')} className="btn btn-secondary" style={{ padding: '14px', justifyContent: 'center' }}>
          <ShoppingCart size={18} />
          <span>Buscar SKU / Producto</span>
        </button>
      </div>
    </div>
  );
};
