import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface CompanyOption {
  id: string;
  name: string;
  tax_id: string;
}

interface SupportCompanySelectorProps {
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string | null) => void;
}

export const SupportCompanySelector: React.FC<SupportCompanySelectorProps> = ({
  selectedCompanyId,
  onSelectCompany,
}) => {
  const { user } = useAuth();
  const roleCode = user?.role?.code || '';
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  if (roleCode !== 'SUPER_ADMIN' && roleCode !== 'PLATFORM_ADMIN') {
    return null;
  }

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await apiFetch('/saas/companies?limit=100');
        if (res.data) {
          setCompanies(res.data);
        }
      } catch (err) {
        console.error('Error cargando empresas para selector de soporte:', err);
      }
    }
    loadCompanies();
  }, []);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#38bdf8',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <ShieldAlert size={15} color="#38bdf8" />
        <span>
          {selectedCompany
            ? `Empresa: ${selectedCompany.name}`
            : '🌐 Todas las Empresas (Vista Plataforma)'}
        </span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '280px',
            zIndex: 100,
            padding: '8px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Seleccionar Empresa Cliente (Modo Soporte):
          </div>

          <div
            onClick={() => {
              onSelectCompany(null);
              setIsOpen(false);
            }}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: !selectedCompanyId ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: !selectedCompanyId ? '#38bdf8' : '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={14} />
              <span>🌐 Vista Red Consolidada</span>
            </div>
            {!selectedCompanyId && <Check size={14} />}
          </div>

          {companies.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onSelectCompany(c.id);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: selectedCompanyId === c.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: selectedCompanyId === c.id ? '#38bdf8' : '#fff',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RUT: {c.tax_id}</div>
              </div>
              {selectedCompanyId === c.id && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
