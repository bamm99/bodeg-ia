import React, { useState, useRef, useEffect } from 'react';
import { Warehouse, ChevronDown, Check, Layers } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';

export const WarehouseSwitcherDropdown: React.FC = () => {
  const { user } = useAuth();
  const { assignedWarehouses, selectedWarehouseId, setSelectedWarehouseId, selectedWarehouse } = useWarehouse();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleCode = user?.role?.code || '';

  // Solo mostrar el selector para roles operativos o supervisores (WAREHOUSE_MANAGER, WAREHOUSE_OPERATOR, COMPANY_ADMIN)
  if (!['WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR', 'COMPANY_ADMIN'].includes(roleCode)) {
    return null;
  }

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedWarehouseId(id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <Warehouse className="w-4 h-4 text-emerald-400" />
        <span className="max-w-[180px] truncate">
          {selectedWarehouseId === 'ALL'
            ? 'Todas mis Bodegas (Consolidado)'
            : selectedWarehouse
            ? selectedWarehouse.name
            : 'Seleccionar Bodega'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-800/80">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2 py-1">
              Mis Bodegas Asignadas
            </p>
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">
            {/* Opción Consolidado */}
            <button
              onClick={() => handleSelect('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                selectedWarehouseId === 'ALL'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Todas mis Bodegas (Consolidado)</span>
              </div>
              {selectedWarehouseId === 'ALL' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Listado de Bodegas */}
            {assignedWarehouses.map((wh) => {
              const isSelected = selectedWarehouseId === wh.id;
              return (
                <button
                  key={wh.id}
                  onClick={() => handleSelect(wh.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex flex-col items-start truncate pr-2">
                    <span className="truncate">{wh.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">Cód: {wh.code}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}

            {assignedWarehouses.length === 0 && (
              <div className="px-3 py-3 text-center text-slate-500 text-xs italic">
                No tienes bodegas específicas asignadas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
