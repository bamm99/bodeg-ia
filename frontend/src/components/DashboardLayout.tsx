import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Crown,
  Briefcase,
  Layers,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Cpu,
  Warehouse,
  Grid,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

import { CompanyListView } from './CompanyListView';
import { PlanManagerView } from './PlanManagerView';
import { ExecutiveAssignmentView } from './ExecutiveAssignmentView';
import { BranchesManagerView } from './BranchesManagerView';
import { WarehousesManagerView } from './WarehousesManagerView';
import { SpatialHierarchyDesigner } from './SpatialHierarchyDesigner';
import { WarehouseMap2D } from './WarehouseMap2D';
import { ProductsCatalogView } from './ProductsCatalogView';
import { Clients3PLView } from './Clients3PLView';
import { ClientPortalDashboard } from './ClientPortalDashboard';
import { CostProfilesManagerView } from './CostProfilesManagerView';
import { ASTFormulaEditorView } from './ASTFormulaEditorView';
import { CostSimulatorView } from './CostSimulatorView';
import { InboundFormView } from './InboundFormView';
import { RelocateFormView } from './RelocateFormView';
import { OutboundFormView } from './OutboundFormView';
import { PendingDispatchRequestsView } from './PendingDispatchRequestsView';
import { KardexView } from './KardexView';
import { InDevelopment } from './InDevelopment';
import { WarehouseSwitcherDropdown } from './WarehouseSwitcherDropdown';

import { SuperAdminDashboard } from './dashboard/SuperAdminDashboard';
import { CompanyAdminDashboard } from './dashboard/CompanyAdminDashboard';
import { WarehouseManagerDashboard } from './dashboard/WarehouseManagerDashboard';
import { OperatorDashboard } from './dashboard/OperatorDashboard';
import { SupportCompanySelector } from './SupportCompanySelector';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
}

interface SidebarGroup {
  groupName: string;
  items: SidebarItem[];
}

interface DashboardLayoutProps {
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supportCompanyId, setSupportCompanyId] = useState<string | null>(null);

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

  // Estructura de menú agrupada por rol con lenguaje de negocio
  const getMenuGroupsByRole = (): SidebarGroup[] => {
    switch (roleCode) {
      case 'SUPER_ADMIN':
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Resumen Plataforma', icon: LayoutDashboard }],
          },
          {
            groupName: 'Clientes & Empresas',
            items: [
              { id: 'companies', label: 'Empresas SaaS', icon: Building2 },
              { id: 'executives', label: 'Asignación de Cartolas', icon: Briefcase },
            ],
          },
          {
            groupName: 'Planes & Cuotas',
            items: [{ id: 'plans', label: 'Planes SaaS & Cuotas', icon: Crown }],
          },
          {
            groupName: 'Infraestructura Red',
            items: [
              { id: 'branches', label: 'Sucursales Físicas', icon: Building2 },
              { id: 'warehouses', label: 'Bodegas & Naves', icon: Warehouse },
              { id: 'spatial', label: 'Diseñador Espacial', icon: Grid },
              { id: 'map2d', label: 'Plano 2D Interactivo', icon: Layers },
            ],
          },
          {
            groupName: 'Operaciones & Inventario',
            items: [
              { id: 'inventory', label: 'Historial de Movimientos', icon: Package },
              { id: 'inbound', label: 'Recepción de Mercancía', icon: ArrowDownRight },
              { id: 'relocate', label: 'Mover Mercancía', icon: RefreshCw },
              { id: 'outbound', label: 'Salida de Mercancía', icon: ArrowUpRight },
              { id: 'dispatch-requests', label: 'Solicitudes 3PL', icon: FileText },
              { id: 'catalog', label: 'Catálogo de SKUs', icon: ShoppingCart },
              { id: 'clients', label: 'Clientes 3PL', icon: Users },
            ],
          },
          {
            groupName: 'Motor de Costos',
            items: [
              { id: 'costs', label: 'Tarifas de Almacenaje', icon: DollarSign },
              { id: 'cost-editor', label: 'Editor de Fórmulas', icon: Cpu },
              { id: 'cost-simulator', label: 'Simulador & Liquidación', icon: DollarSign },
            ],
          },
        ];

      case 'PLATFORM_ADMIN':
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Mi Cartola Comercial', icon: LayoutDashboard }],
          },
          {
            groupName: 'Mis Clientes',
            items: [
              { id: 'companies', label: 'Empresas en Cartola', icon: Building2 },
              { id: 'clients', label: 'Clientes 3PL', icon: Users },
            ],
          },
          {
            groupName: 'Supervisión Bodegas',
            items: [{ id: 'map2d', label: 'Plano 2D Interactivo', icon: Layers }],
          },
          {
            groupName: 'Tarifas & Cotizaciones',
            items: [
              { id: 'costs', label: 'Tarifas de Almacenaje', icon: DollarSign },
              { id: 'cost-simulator', label: 'Simulador de Cotización', icon: DollarSign },
            ],
          },
          {
            groupName: 'Operaciones & Solicitudes',
            items: [
              { id: 'dispatch-requests', label: 'Solicitudes 3PL', icon: FileText },
              { id: 'inventory', label: 'Historial de Movimientos', icon: Package },
              { id: 'catalog', label: 'Catálogo de SKUs', icon: ShoppingCart },
            ],
          },
        ];

      case 'COMPANY_ADMIN':
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Resumen Empresa', icon: LayoutDashboard }],
          },
          {
            groupName: 'Infraestructura',
            items: [
              { id: 'companies', label: 'Ficha de Empresa', icon: Building2 },
              { id: 'branches', label: 'Sucursales', icon: Building2 },
              { id: 'warehouses', label: 'Bodegas', icon: Warehouse },
              { id: 'spatial', label: 'Diseñador Espacial', icon: Grid },
              { id: 'map2d', label: 'Plano 2D Interactivo', icon: Layers },
            ],
          },
          {
            groupName: 'Inventario & Operaciones',
            items: [
              { id: 'inbound', label: 'Recepción de Mercancía', icon: ArrowDownRight },
              { id: 'relocate', label: 'Mover Mercancía', icon: RefreshCw },
              { id: 'outbound', label: 'Salida / Despacho', icon: ArrowUpRight },
              { id: 'inventory', label: 'Historial Kardex', icon: Package },
            ],
          },
          {
            groupName: 'Clientes 3PL & Servicios',
            items: [
              { id: 'dispatch-requests', label: 'Solicitudes 3PL', icon: FileText },
              { id: 'clients', label: 'Clientes 3PL', icon: Users },
              { id: 'catalog', label: 'Catálogo de Productos', icon: ShoppingCart },
            ],
          },
          {
            groupName: 'Costos & Tarifas',
            items: [
              { id: 'costs', label: 'Tarifas por Zona', icon: DollarSign },
              { id: 'cost-editor', label: 'Editor de Fórmulas', icon: Cpu },
              { id: 'cost-simulator', label: 'Simulador & Liquidación', icon: DollarSign },
            ],
          },
        ];

      case 'WAREHOUSE_MANAGER':
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Resumen Bodegas', icon: LayoutDashboard }],
          },
          {
            groupName: 'Plano & Estructura',
            items: [{ id: 'map2d', label: 'Plano 2D de Bodega', icon: Layers }],
          },
          {
            groupName: 'Operaciones de Bodega',
            items: [
              { id: 'inbound', label: 'Recepción de Mercancía', icon: ArrowDownRight },
              { id: 'relocate', label: 'Mover Mercancía', icon: RefreshCw },
              { id: 'outbound', label: 'Salida de Mercancía', icon: ArrowUpRight },
              { id: 'inventory', label: 'Historial Kardex Bodega', icon: Package },
            ],
          },
          {
            groupName: 'Despachos 3PL',
            items: [
              { id: 'dispatch-requests', label: 'Solicitudes 3PL', icon: FileText },
              { id: 'catalog', label: 'Catálogo de SKUs', icon: ShoppingCart },
            ],
          },
          {
            groupName: 'Tarifas (Consulta)',
            items: [
              { id: 'costs', label: 'Tarifas por Zona', icon: DollarSign },
              { id: 'cost-simulator', label: 'Simulador de Almacenaje', icon: DollarSign },
            ],
          },
        ];

      case 'WAREHOUSE_OPERATOR':
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Mis Tareas del Día', icon: LayoutDashboard }],
          },
          {
            groupName: 'Ubicación & Mapa',
            items: [
              { id: 'map2d', label: 'Plano 2D de Bodega', icon: Layers },
              { id: 'catalog', label: 'Catálogo de SKUs', icon: ShoppingCart },
            ],
          },
          {
            groupName: 'Operaciones en Terreno',
            items: [
              { id: 'inbound', label: 'Recepción de Mercancía', icon: ArrowDownRight },
              { id: 'relocate', label: 'Mover Mercancía', icon: RefreshCw },
              { id: 'outbound', label: 'Despacho de Mercancía', icon: ArrowUpRight },
              { id: 'inventory', label: 'Historial Kardex', icon: Package },
            ],
          },
        ];

      case 'COMMERCIAL_MANAGEMENT':
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Resumen Comercial', icon: LayoutDashboard }],
          },
          {
            groupName: 'Clientes 3PL',
            items: [
              { id: 'clients', label: 'Cartera Clientes 3PL', icon: Users },
              { id: 'dispatch-requests', label: 'Solicitudes 3PL', icon: FileText },
            ],
          },
          {
            groupName: 'Tarifas & Cotización',
            items: [
              { id: 'costs', label: 'Tarifas por Zona', icon: DollarSign },
              { id: 'cost-simulator', label: 'Simulador & Liquidación', icon: DollarSign },
            ],
          },
          {
            groupName: 'Catálogo',
            items: [{ id: 'catalog', label: 'Catálogo de SKUs', icon: ShoppingCart }],
          },
        ];

      case 'CLIENT_VIEWER':
      default:
        return [
          {
            groupName: 'Principal',
            items: [{ id: 'dashboard', label: 'Mi Stock en Custodia', icon: LayoutDashboard }],
          },
          {
            groupName: 'Solicitudes de Despacho',
            items: [{ id: 'dispatch-requests', label: 'Mis Solicitudes 3PL', icon: FileText }],
          },
          {
            groupName: 'Inventario',
            items: [
              { id: 'inventory', label: 'Historial Kardex', icon: Package },
              { id: 'clients', label: 'Mi Ficha 3PL', icon: Users },
            ],
          },
        ];
    }
  };

  const menuGroups = getMenuGroupsByRole();

  // Distintivo de alcance de empresa / plataforma según Rol
  const renderBadgeByRole = () => {
    if (roleCode === 'SUPER_ADMIN') {
      return (
        <div className="badge badge-primary" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8' }}>
          <Crown size={14} color="#38bdf8" /> Super Admin — Plataforma Global
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

  const handleNavigate = (section: string) => {
    setActiveSection(section);
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
        <div style={{ overflowY: 'auto' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '0 8px' }}>
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

          {/* Grouped Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '6px',
                    padding: '0 10px',
                  }}
                >
                  {group.groupName}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                          background: isActive ? 'var(--primary-glow)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.83rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
            {activeSection === 'dashboard'
              ? 'Dashboard General'
              : activeSection === 'companies'
              ? 'Gestión de Empresas'
              : activeSection === 'branches'
              ? 'Sucursales Físicas'
              : activeSection === 'warehouses'
              ? 'Bodegas & Naves'
              : activeSection === 'spatial'
              ? 'Diseñador Espacial'
              : activeSection === 'map2d'
              ? 'Plano 2D Interactivo'
              : activeSection === 'inbound'
              ? 'Recepción de Mercancía (Inbound)'
              : activeSection === 'relocate'
              ? 'Mover Mercancía (Relocate)'
              : activeSection === 'outbound'
              ? 'Salida de Mercancía (Outbound)'
              : activeSection === 'inventory'
              ? 'Historial Kardex de Movimientos'
              : activeSection === 'dispatch-requests'
              ? 'Solicitudes de Despacho 3PL'
              : activeSection === 'costs'
              ? 'Tarifas por Zona'
              : activeSection === 'cost-editor'
              ? 'Editor de Fórmulas de Costo'
              : activeSection === 'cost-simulator'
              ? 'Simulador & Liquidación 3PL'
              : activeSection === 'catalog'
              ? 'Catálogo de SKUs'
              : activeSection === 'clients'
              ? 'Clientes 3PL'
              : activeSection === 'plans'
              ? 'Planes SaaS & Cuotas'
              : activeSection === 'executives'
              ? 'Asignación de Cartolas'
              : activeSection}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <SupportCompanySelector selectedCompanyId={supportCompanyId} onSelectCompany={setSupportCompanyId} />
            <WarehouseSwitcherDropdown />
            {renderBadgeByRole()}
            <div className="badge badge-success">
              <CheckCircle2 size={14} /> Backend API v1.0
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {activeSection === 'dashboard' ? (
            roleCode === 'SUPER_ADMIN' ? (
              <SuperAdminDashboard data={dashboardData} loading={loading} onNavigate={handleNavigate} />
            ) : roleCode === 'COMPANY_ADMIN' ? (
              <CompanyAdminDashboard data={dashboardData} loading={loading} user={user} onNavigate={handleNavigate} />
            ) : roleCode === 'WAREHOUSE_MANAGER' ? (
              <WarehouseManagerDashboard user={user} onNavigate={handleNavigate} />
            ) : roleCode === 'WAREHOUSE_OPERATOR' ? (
              <OperatorDashboard onNavigate={handleNavigate} />
            ) : roleCode === 'CLIENT_VIEWER' ? (
              <ClientPortalDashboard />
            ) : (
              <CompanyAdminDashboard data={dashboardData} loading={loading} user={user} onNavigate={handleNavigate} />
            )
          ) : activeSection === 'companies' ? (
            <CompanyListView />
          ) : activeSection === 'branches' ? (
            <BranchesManagerView />
          ) : activeSection === 'warehouses' ? (
            <WarehousesManagerView />
          ) : activeSection === 'spatial' ? (
            <SpatialHierarchyDesigner />
          ) : activeSection === 'map2d' ? (
            <WarehouseMap2D />
          ) : activeSection === 'costs' ? (
            <CostProfilesManagerView />
          ) : activeSection === 'cost-editor' ? (
            <ASTFormulaEditorView />
          ) : activeSection === 'cost-simulator' ? (
            <CostSimulatorView />
          ) : activeSection === 'inventory' ? (
            <KardexView />
          ) : activeSection === 'inbound' ? (
            <InboundFormView />
          ) : activeSection === 'relocate' ? (
            <RelocateFormView />
          ) : activeSection === 'outbound' ? (
            <OutboundFormView />
          ) : activeSection === 'dispatch-requests' ? (
            <PendingDispatchRequestsView />
          ) : activeSection === 'catalog' ? (
            <ProductsCatalogView />
          ) : activeSection === 'clients' ? (
            <Clients3PLView />
          ) : activeSection === 'plans' ? (
            <PlanManagerView />
          ) : activeSection === 'executives' ? (
            <ExecutiveAssignmentView />
          ) : (
            <InDevelopment
              sectionTitle={activeSection}
              onBackToDashboard={() => setActiveSection('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  );
};
