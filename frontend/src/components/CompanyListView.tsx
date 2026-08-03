import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Eye, Crown, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '../config/api';
import { CompanyCreateWizard } from './CompanyCreateWizard';
import { CompanyDetailModal } from './CompanyDetailModal';

export const CompanyListView: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/saas/companies?page=${page}&limit=10`);
      if (res.data) {
        setCompanies(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Error cargando empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tax_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="var(--primary)" />
            <span>Gestión de Empresas SaaS</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Administra las empresas clientes multi-tenant, sus planes activos y cuotas operativas.
          </p>
        </div>

        <button onClick={() => setIsWizardOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Alta de Nueva Empresa</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: '380px' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        <input
          type="text"
          placeholder="Buscar por Razón Social o RUT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '38px' }}
        />
      </div>

      {/* Companies Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px' }}>Empresa / Razón Social</th>
                <th style={{ padding: '16px' }}>RUT</th>
                <th style={{ padding: '16px' }}>Plan SaaS</th>
                <th style={{ padding: '16px' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando empresas clientes...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron empresas clientes registradas.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const planName = c.subscriptions?.[0]?.plans?.name || 'BASIC';
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={16} color="var(--primary)" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.tax_id}</td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge badge-primary">
                          <Crown size={12} />
                          {planName}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={c.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                          {c.is_active ? (
                            <>
                              <CheckCircle2 size={12} /> Activo
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> Inactivo
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedCompanyId(c.id);
                            setIsDetailOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} />
                          <span>Ver Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>
            Página {page} de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn btn-secondary"
              style={{ padding: '6px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="btn btn-secondary"
              style={{ padding: '6px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Wizard Create Company */}
      <CompanyCreateWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchCompanies}
      />

      {/* Detail Modal */}
      <CompanyDetailModal
        companyId={selectedCompanyId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCompanyId(null);
        }}
      />
    </div>
  );
};
