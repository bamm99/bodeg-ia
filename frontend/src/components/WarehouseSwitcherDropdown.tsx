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

  if (!['WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR', 'COMPANY_ADMIN'].includes(roleCode)) {
    return null;
  }

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
        className="btn btn-secondary text-xs"
        style={{ padding: '6px 14px', borderRadius: '10px' }}
      >
        <Warehouse size={16} color="var(--primary)" />
        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedWarehouseId === 'ALL'
            ? 'Todas mis Bodegas (Consolidado)'
            : selectedWarehouse
            ? selectedWarehouse.name
            : 'Seleccionar Bodega'}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '8px',
            width: '260px',
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            padding: '4px',
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mis Bodegas Asignadas
            </p>
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px 0' }}>
            {/* Option Consolidado */}
            <div
              onClick={() => handleSelect('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: selectedWarehouseId === 'ALL' ? 'var(--primary-glow)' : 'transparent',
                color: selectedWarehouseId === 'ALL' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: selectedWarehouseId === 'ALL' ? 700 : 500,
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={14} color="var(--primary)" />
                <span>Todas mis Bodegas (Consolidado)</span>
              </div>
              {selectedWarehouseId === 'ALL' && <Check size={14} color="var(--primary)" />}
            </div>

            {/* List of Warehouses */}
            {assignedWarehouses.map((wh) => {
              const isSelected = selectedWarehouseId === wh.id;
              return (
                <div
                  key={wh.id}
                  onClick={() => handleSelect(wh.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-glow)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: isSelected ? 700 : 500,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cód: {wh.code}</span>
                  </div>
                  {isSelected && <Check size={14} color="var(--primary)" />}
                </div>
              );
            })}

            {assignedWarehouses.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                No tienes bodegas específicas asignadas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
