import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  Cpu,
  Warehouse,
  Activity,
  CheckCircle2,
  Briefcase,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InDevelopment } from './InDevelopment';
import { API_BASE_URL } from '../config/api';

interface DashboardLayoutProps {
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const roleCode = user?.role?.code || 'COMPANY_ADMIN';

  useEffect(() => {
    async function fetchOverview() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/saas/dashboard-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [token]);

  const sidebarMenu = [
    { id: 'dashboard', label: 'Resumen Dashboard', icon: LayoutDashboard, isReady: true },
    { id: 'map2d', label: 'Plano 2D de Bodegas', icon: Layers, isReady: false },
    { id: 'costs', label: 'Tarifario & Costos AST', icon: DollarSign, isReady: false },
    { id: 'inventory', label: 'Inventario & Kardex', icon: Package, isReady: false },
    { id: 'catalog', label: 'Catálogo de Productos', icon: ShoppingCart, isReady: false },
    { id: 'clients', label: 'Clientes 3PL', icon: Users, isReady: false },
    { id: 'companies', label: 'Empresas & Sucursales', icon: Building2, isReady: false },
    { id: 'rbac', label: 'Usuarios & Permisos RBAC', icon: ShieldCheck, isReady: false },
    { id: 'settings', label: 'Configuración Sistema', icon: Settings, isReady: false },
  ];

  const currentMenuItem = sidebarMenu.find((m) => m.id === activeSection);

  // Distintivo de alcance de empresa / plataforma según Rol
  const renderBadgeByRole = () => {
    if (roleCode === 'SUPER_ADMIN') {
      return (
        <div className="badge badge-primary" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8' }}>
          <Crown size={14} color="#38bdf8" /> Super Admin — Visibilidad Total Plataforma
        </div>
      );
    }
    if (roleCode === 'PLATFORM_ADMIN') {
      return (
        <div className="badge badge-primary" style={{ background: 'rgba(129, 140, 248, 0.2)', border: '1px solid #818cf8', color: '#818cf8' }}>
          <Briefcase size={14} color="#818cf8" /> Ejecutivo — Cartola de Clientes
        </div>
      );
    }
    return (
      <div className="badge badge-primary">
        <Building2 size={14} /> {user?.company?.name || 'Mi Empresa Logística'}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 16px',
        }}
      >
        <div>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={20} color="#070a11" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Bodeg<span className="gradient-text">-IA</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sidebarMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    background: isActive ? 'var(--primary-glow)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {!item.isReady && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fcd34d',
                      }}
                    >
                      Dev
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ marginBottom: '12px', padding: '0 8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{user?.fullName || 'Usuario'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role?.name || roleCode}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
            {currentMenuItem?.label || 'Dashboard'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {renderBadgeByRole()}
            <div className="badge badge-success">
              <CheckCircle2 size={14} /> Backend API v1.0
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {activeSection === 'dashboard' ? (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  Bienvenido, <span className="gradient-text">{user?.fullName || 'Administrador'}</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {dashboardData?.scopeName || 'Cargando alcance del usuario...'}
                </p>
              </div>

              {/* Statistics Grid Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {roleCode === 'SUPER_ADMIN' ? (
                  <>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Empresas Registradas</span>
                        <Building2 size={18} color="var(--primary)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : dashboardData?.stats?.totalCompaniesCount || 5}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Empresas SaaS Activas</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Total Bodegas Plataforma</span>
                        <Warehouse size={18} color="var(--secondary)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : dashboardData?.stats?.totalWarehousesCount || 6}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Bodegas registradas globales</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Almacenaje Global (m³)</span>
                        <Layers size={18} color="var(--warning)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : `${dashboardData?.stats?.totalStorageM3 || 1440.0} m³`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px' }}>Capacidad agregada total</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Ocupación Agregada</span>
                        <Activity size={18} color="var(--accent)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {loading ? '...' : `${dashboardData?.stats?.totalOccupiedM3 || 560.4} m³`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Ocupación de red de bodegas</div>
                    </div>
                  </>
                ) : roleCode === 'PLATFORM_ADMIN' ? (
                  <>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Cartola de Clientes Asignados</span>
                        <Briefcase size={18} color="var(--primary)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : dashboardData?.stats?.assignedCompaniesCount || 2}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Empresas a tu cargo</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Bodegas a tu Cargo</span>
                        <Warehouse size={18} color="var(--secondary)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : dashboardData?.stats?.totalWarehousesCount || 3}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Bodegas en tu cartola</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Capacidad Cartola (m³)</span>
                        <Layers size={18} color="var(--warning)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : `${dashboardData?.stats?.totalStorageM3 || 720.0} m³`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px' }}>Volumen supervisado</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Bodegas de la Empresa</span>
                        <Warehouse size={18} color="var(--primary)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : dashboardData?.stats?.totalWarehousesCount || 2}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Sucursales propias</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Capacidad de Almacenaje</span>
                        <Layers size={18} color="var(--secondary)" />
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                        {loading ? '...' : `${dashboardData?.stats?.totalStorageM3 || 480.0} m³`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Capacidad contratada</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                        <span>Plan SaaS Contratado</span>
                        <Activity size={18} color="var(--accent)" />
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                        {loading ? '...' : dashboardData?.stats?.planName || 'PRO'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Empresa Activa</div>
                    </div>
                  </>
                )}
              </div>

              {/* Lista Detallada de Empresas (Para Super Admin & Platform Executive) */}
              {(roleCode === 'SUPER_ADMIN' || roleCode === 'PLATFORM_ADMIN') && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                    {roleCode === 'SUPER_ADMIN' ? '🏢 Empresas Registradas en la Plataforma' : '💼 Cartola de Clientes a tu Cargo'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(dashboardData?.companiesList || dashboardData?.assignedCompanies || []).map((comp: any) => (
                      <div
                        key={comp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{comp.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>RUT: {comp.taxId}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{comp.warehousesCount} Bodega(s)</span>
                          <span className="badge badge-primary">{comp.planName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <InDevelopment
              sectionTitle={currentMenuItem?.label || activeSection}
              onBackToDashboard={() => setActiveSection('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  );
};
