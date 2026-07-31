import React from 'react';
import { Warehouse, DollarSign, Package, Building2, Cpu, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeWarehouseName: string;
  activeCompanyName: string;
  userRole: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeWarehouseName,
  activeCompanyName,
  userRole,
}) => {
  const tabs = [
    { id: 'map', label: 'Plano 2D & Estructura', icon: Warehouse },
    { id: 'costs', label: 'Perfil & Simulador de Costos', icon: DollarSign },
    { id: 'inventory', label: 'Inventario & Kardex', icon: Package },
    { id: 'company', label: 'Empresas & Roles', icon: Building2 },
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px' }}>
        {/* Top Row: Logo & Profile */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Cpu size={24} color="#090d16" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                Bodeg<span style={{ color: 'var(--primary)' }}>-IA</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Gestión Inteligente & Modelo de Costos de Almacenaje Multi-tenant
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {activeCompanyName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <ShieldCheck size={12} />
                {userRole}
              </div>
            </div>

            <div
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              Bodega Activa: <strong style={{ color: '#fff' }}>{activeWarehouseName}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
