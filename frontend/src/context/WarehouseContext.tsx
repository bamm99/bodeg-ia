import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../config/api';

export interface WarehouseInfo {
  id: string;
  name: string;
  code: string;
  branchName?: string;
  isCostTrackingEnabled?: boolean;
}

interface WarehouseContextType {
  assignedWarehouses: WarehouseInfo[];
  selectedWarehouseId: string;
  selectedWarehouse: WarehouseInfo | null;
  setSelectedWarehouseId: (id: string) => void;
  loading: boolean;
  refetchWarehouses: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [assignedWarehouses, setAssignedWarehouses] = useState<WarehouseInfo[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAssignedWarehouses = async () => {
    if (!token || !user) return;

    // Solo consultar para roles que operan con múltiples bodegas o supervisan bodegas
    if (['SUPER_ADMIN', 'COMPANY_ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR'].includes(user.role?.code || '')) {
      try {
        setLoading(true);
        const data = await apiFetch<WarehouseInfo[]>('/locations/my-assigned-warehouses', { token });
        if (Array.isArray(data)) {
          setAssignedWarehouses(data);
          // Si solo tiene 1 bodega asignada, seleccionarla por defecto
          if (data.length === 1 && selectedWarehouseId === 'ALL') {
            setSelectedWarehouseId(data[0].id);
          }
        }
      } catch (err) {
        // Fallback seguro a lista vacía si aún no hay bodegas creadas
        setAssignedWarehouses([]);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAssignedWarehouses();
  }, [user, token]);

  const selectedWarehouse =
    selectedWarehouseId === 'ALL'
      ? null
      : assignedWarehouses.find((w) => w.id === selectedWarehouseId) || null;

  return (
    <WarehouseContext.Provider
      value={{
        assignedWarehouses,
        selectedWarehouseId,
        selectedWarehouse,
        setSelectedWarehouseId,
        loading,
        refetchWarehouses: fetchAssignedWarehouses,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = (): WarehouseContextType => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse debe ser utilizado dentro de un WarehouseProvider');
  }
  return context;
};
