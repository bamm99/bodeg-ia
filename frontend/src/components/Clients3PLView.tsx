import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Mail, ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import { apiFetch } from '../config/api';

interface Client3PL {
  id: string;
  name: string;
  tax_id?: string;
  is_internal_company: boolean;
  users?: any[];
}

export const Clients3PLView: React.FC = () => {
  const [clients, setClients] = useState<Client3PL[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client3PL | null>(null);
  const [formData, setFormData] = useState({ name: '', tax_id: '', is_internal_company: false });

  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/catalog/clients');
      if (res.data) setClients(res.data);
    } catch (err) {
      console.error('Error cargando clientes 3PL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (c?: Client3PL) => {
    setError(null);
    if (c) {
      setEditingClient(c);
      setFormData({ name: c.name, tax_id: c.tax_id || '', is_internal_company: c.is_internal_company });
    } else {
      setEditingClient(null);
      setFormData({ name: '', tax_id: '', is_internal_company: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre de la empresa cliente es obligatorio');
      return;
    }

    try {
      if (editingClient) {
        await apiFetch(`/catalog/clients/${editingClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch('/catalog/clients', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message || 'Error al guardar cliente');
    }
  };

  const handleInviteToPortal = async (client: Client3PL) => {
    try {
      const res = await apiFetch(`/catalog/clients/${client.id}/invite-portal`, {
        method: 'POST',
      });
      if (res.data) {
        setInviteResult(res.data);
        fetchClients();
      }
    } catch (err: any) {
      alert(err.message || 'Error al generar invitación a portal');
    }
  };

  const handleCopyCredentials = () => {
    if (!inviteResult) return;
    const text = `Credenciales Portal 3PL Bodeg-IA:\nLink: ${inviteResult.loginUrl}\nEmail: ${inviteResult.portalEmail}\nClave Temp: ${inviteResult.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente 3PL?')) return;
    try {
      await apiFetch(`/catalog/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar cliente');
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tax_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="var(--primary)" />
            Cartera de Clientes 3PL & Propietarios de Stock
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Registra los clientes externos que almacenan mercancía en tus bodegas y otórgales acceso a su portal 3PL.
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={16} />
          <span>Nuevo Cliente 3PL</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar cliente por nombre o RUT/Tax ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Nombre Cliente / Empresa</th>
              <th style={{ padding: '16px' }}>RUT / Identificador</th>
              <th style={{ padding: '16px' }}>Tipo de Almacenamiento</th>
              <th style={{ padding: '16px' }}>Portal 3PL Autoservicio</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando clientes 3PL...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron clientes registradas.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {c.tax_id || 'N/A'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.is_internal_company ? (
                      <span className="badge badge-primary">Stock Propio Interno</span>
                    ) : (
                      <span className="badge badge-warning">Tercero / Cliente 3PL</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {!c.is_internal_company ? (
                      <button
                        onClick={() => handleInviteToPortal(c)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--primary)' }}
                      >
                        <Mail size={14} />
                        <span>✉️ Invitar a Portal 3PL</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N/A (Uso Interno)</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(c)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invitation Portal Result Modal */}
      {inviteResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="badge badge-primary" style={{ padding: '8px', borderRadius: '10px' }}>
                <ShieldCheck size={20} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Invitación de Acceso a Portal 3PL
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Credenciales temporales de autoservicio generadas para {inviteResult.clientName}
                </p>
              </div>
            </div>

            <div style={{ background: '#0d131f', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>URL Portal de Acceso:</span>
                <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.85rem' }}>{inviteResult.loginUrl}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usuario Email Asignado:</span>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{inviteResult.portalEmail}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contraseña Temporal:</span>
                <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>{inviteResult.tempPassword}</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '4px' }}>
                ⏱️ Nota de Seguridad: La sesión de este usuario expira automáticamente tras 15 minutos de inactividad server-side.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button onClick={handleCopyCredentials} className="btn btn-secondary">
                <Copy size={16} />
                <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Credenciales'}</span>
              </button>
              <button onClick={() => setInviteResult(null)} className="btn btn-primary">
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              {editingClient ? 'Editar Cliente 3PL' : 'Crear Nuevo Cliente 3PL'}
            </h3>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nombre de la Empresa Cliente *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. Frutas del Cachapoal Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>RUT / Tax ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. 96.111.222-3"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="internalCheck"
                  checked={formData.is_internal_company}
                  onChange={(e) => setFormData({ ...formData, is_internal_company: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="internalCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Es Cliente Interno de la Empresa (Stock Propio)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente 3PL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
